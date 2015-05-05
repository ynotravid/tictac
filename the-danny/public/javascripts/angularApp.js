var app = angular.module('flapperNews',['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		$stateProvider.state('home', {
			url: '/home',
			templateUrl: '/home.html',
			controller: 'MainCtrl',
			resolve: {
				postPromise: ['posts', function(posts) {
					return posts.getAll();
				}]
			},
			onEnter: function(posts){
				if(posts) {
					console.log(posts);
				}
			},
			onExit: function(posts){
				if(posts) {
					console.log(posts);
				}
			}
		})
		.state('posts', {
			url: '/posts/{id}',
			templateUrl: '/posts.html',
			controller: 'PostsCtrl',
			resolve: {
				post: ['$stateParams', 'posts', function($stateParams, posts) {
					return posts.get($stateParams.id);
				}]
			}
		})
		.state('login', {
			url: '/login',
			templateUrl: '/login.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if(auth.isLoggedIn()){
					$state.go('home');
				}
			}]
		})
		.state('register', {
			url: '/register',
			templateUrl: '/register.html',
			controller: 'AuthCtrl',
			onEnter: ['$state', 'auth', function($state, auth){
				if(auth.isLoggedIn()){
					$state.go('home');
				}
			}]
			})
			.state('yard', {
				url: '/yard/{id}',
				templateUrl: '/yard.html',
				controller: 'YardCtrl',
				resolve: {
					//	post: ['$stateParams', 'posts', function($stateParams, posts) {
					//		return posts.get($stateParams.id);
					//	}]
				}
			})
			.state('yardWeb', {
				url: '/yardWeb',
				templateUrl: '/yard-web.html',
				controller: 'YardCtrl',
				resolve: {
					//	post: ['$stateParams', 'posts', function($stateParams, posts) {
					//		return posts.get($stateParams.id);
					//	}]
				}
		});

		$urlRouterProvider.otherwise('home');
	}
])
.factory('auth', ['$http', '$window', function($http, $window){
	var auth = {};
	auth.saveToken = function (token){
		$window.localStorage['do-nothing-token'] = token;
	};

	auth.getToken = function (){
		return $window.localStorage['do-nothing-token'];
	}

	auth.isLoggedIn = function(){
		var token = auth.getToken();

		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function(){
		if(auth.isLoggedIn()){
			var token = auth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function(user){
		return $http.post('/register', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logIn = function(user){
		return $http.post('/login', user).success(function(data){
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function(){
		$window.localStorage.removeItem('do-nothing-token');
	};

	return auth;
}])
.factory('posts', ['$http','auth', function($http, auth){
	var o = { 'posts': [] };

	o.getAll = function() {
		return $http.get('/posts').success(function(data){
			o.posts = angular.copy(data);
		});
	};

	o.create = function(post) {
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			o.posts.push(data);
		});
	};

	o.upvote = function(post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			post.upvotes += 1;
		});
	};

	o.get = function(id) {
		return $http.get('/posts/' + id).then(function(res){
			return res.data;
		});
	};

	o.addComment = function(id, comment) {
		return $http.post('/posts/' + id + '/comments', comment, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		});
	};

	o.upvoteComment = function(post, comment) {
		return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, {
			headers: {Authorization: 'Bearer '+auth.getToken()}
		}).success(function(data){
			comment.upvotes += 1;
		});
	};

	return o;
}])
.controller('MainCtrl', ['$scope', 'posts', 'auth',
	function($scope, posts, auth){
		$scope.title = 'Hello there';
		$scope.posts = posts.posts;
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.addPost = function(){
			if(!$scope.title) { return; }
			posts.create({
				title: $scope.title,
				link: $scope.link
			});
			$scope.title = '';
			$scope.link = '';
		};

		$scope.incrementUpvotes = function(currPost) {
			posts.upvote(currPost);
		};

	}
])
.controller('PostsCtrl', ['$scope', 'posts', 'post', 'auth', function($scope, posts, post, auth) {
//	$scope.post = posts.posts[$stateParams.id];
	$scope.post = post;
	$scope.isLoggedIn = auth.isLoggedIn;

	$scope.addComment = function(){
		if($scope.body === '') { return; }
		posts.addComment(post._id, {
			body: $scope.body,
			author: 'user'
		}).success(function(comment) {
			$scope.post.comments.push(comment);
		});
		$scope.body = '';
	};

	$scope.incrementUpvotes = function(comment){
		posts.upvoteComment(post, comment);
	};
}])
.controller('AuthCtrl', ['$scope', '$state', 'auth',
	function($scope, $state, auth){
		$scope.user = {};

		$scope.register = function(){
			auth.register($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		};

		$scope.logIn = function(){
			auth.logIn($scope.user).error(function(error){
				$scope.error = error;
			}).then(function(){
				$state.go('home');
			});
		};
	}
])
.controller('NavCtrl', ['$scope', 'auth',
	function($scope, auth){
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}
])
.controller('YardCtrl', ['$scope', 'auth', function($scope, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;


		// Canvas State Variables
		$scope.startCoords = {x: 0, y: 0};
		$scope.last = {x: 0, y: 0};
		$scope.isDown = false;

		$scope.canvas = angular.element(document.querySelector("#isometric"))[0];
		var ctx = $scope.canvas.getContext("2d");


		$scope.onMouseMove = function (e) {

			var ctx = $scope.canvas.getContext("2d");

			var xVal = e.pageX - this.offsetLeft;
			var yVal = e.pageY - this.offsetTop;

			if ($scope.isDown) {
				ctx.setTransform(1, 0, 0, 1,
					xVal - $scope.startCoords.x,
					yVal - $scope.startCoords.y);
				$scope.draw();
				ctx.save();
			}
		};

		$scope.onMouseDown = function (e) {

			$scope.isDown = true;
			$scope.startCoords = {
				//x: e.pageX - this.offsetLeft - $scope.last.x,
				//y: e.pageY - this.offsetTop - $scope.last.y
				x: e.pageX - $scope.last.x,
				y: e.pageY - $scope.last.y
			};
		};

		$scope.onMouseUp = function (e) {
			$scope.isDown = false;
			//$scope.last = {x: e.pageX - this.offsetLeft - $scope.startCoords.x,
			//	y: e.pageY - this.offsetTop - $scope.startCoords.y};
			$scope.last = {
				x: e.pageX - this.offsetLeft - $scope.startCoords.x,
				y: e.pageY - this.offsetTop - $scope.startCoords.y
			};
		};

		//$(window).bind("resize", function(){
		//	init();
		//});

		$scope.init = function () {
			$scope.canvas.width = document.body.clientWidth / 2;
			$scope.canvas.height = document.body.clientHeight / 2;

			$scope.draw();
		};

		$scope.draw = function () {
			var canvas = $scope.canvas;
			var start;

			if (canvas.getContext) {
				var ctx = canvas.getContext("2d");

				var p1 = ctx.transformedPoint(0, 0);
				var p2 = ctx.transformedPoint(canvas.width, canvas.height);
				ctx.clearRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

				//ctx.fillRect(0,0,canvas.width,canvas.height);

				// Draw Pad
				for (var x = 11; x >= -1; x--) {
					for (var y = 2; y <= 23; y++) {
						var pad = angular.element(document.querySelector("#pad"))[0];
						start = isoConvert(x, y);

						ctx.drawImage(pad, start.x - 6, start.y + 0);
					}
				}

				// Draw Crane Track
				for (var x = -2; x >= -2; x--) {
					for (var y = 2; y <= 23; y++) {
						var track = angular.element(document.querySelector("#track"))[0];
						start = isoConvert(x, y);

						ctx.drawImage(track, start.x - 6, start.y + 0);
					}
				}


				// Draw Grid for reference
				/*
				 for (var x = -50; x < 50; x++) {
				 for (var y = -50; y < 50; y++) {
				 start = isoConvert(x, y);
				 ctx.globalAlpha = 0.4;

				 ctx.beginPath();
				 ctx.moveTo(start.x + 0, start.y + 16);
				 ctx.lineTo(start.x + 27, start.y + 0);
				 ctx.lineTo(start.x + 54, start.y + 16);
				 ctx.lineTo(start.x + 27, start.y + 32);
				 ctx.lineTo(start.x + 0, start.y + 16);
				 ctx.strokeStyle = '#e0e0e0';

				 ctx.textAlign = "center";
				 ctx.textBaseline = "middle";
				 ctx.font = "regular 9px sans-serif";
				 ctx.fillStyle = '#ddd';
				 ctx.fillText(x+","+y, start.x + 27, start.y + 16);
				 ctx.lineWidth = 1;
				 ctx.stroke();

				 ctx.globalAlpha = 1.0;
				 }
				 }
				 */

				// Draw Random Containers
				var container = []
				container[0] = angular.element(document.querySelector("#container-blue"))[0];
				container[1] = angular.element(document.querySelector("#container-grey"))[0];
				container[2] = angular.element(document.querySelector("#container-red"))[0];
				container[3] = angular.element(document.querySelector("#container-yellow"))[0];

				ctx.drawImage(container[0], (2 * 54) + 0, (2 * 32) - 68);
				ctx.drawImage(container[0], (2.5 * 54) + 0, (2.5 * 32) - 68);
				ctx.drawImage(container[1], (3 * 54) + 0, (3 * 32) - 68);

				ctx.drawImage(container[3], (2 * 54) + 0, (2 * 32) - 102);

				// level 2
				ctx.drawImage(container[0], (2.5 * 54) + 0, (2.5 * 32) - 102);

				ctx.drawImage(container[2], (3.5 * 54) + 0, (3.5 * 32) - 68);
				// level 2
				ctx.drawImage(container[2], (3 * 54) + 0, (3 * 32) - 102);

				// Draw Container
				containerEvergreen = angular.element(document.querySelector("#container-evergreen"))[0];
				containerMaersk = angular.element(document.querySelector("#container-maersk"))[0];

				start = isoConvert(0, 12);
				ctx.drawImage(containerEvergreen, start.x + 0, start.y - 46);
				// level 2
				start = isoConvert(0, 12);
				ctx.drawImage(containerEvergreen, start.x + 0, start.y - 46 - 34);

				start = isoConvert(0, 15);
				ctx.drawImage(containerEvergreen, start.x + 0, start.y - 46);
				// level 2
				start = isoConvert(0, 15);
				ctx.drawImage(containerMaersk, start.x + 0, start.y - 46 - 34);

				start = isoConvert(0, 18);
				ctx.drawImage(containerMaersk, start.x + 0, start.y - 46);
				// level 2
				start = isoConvert(0, 18);
				ctx.drawImage(containerMaersk, start.x + 0, start.y - 46 - 34);
				// level 3
				start = isoConvert(0, 18);
				ctx.drawImage(containerMaersk, start.x + 0, start.y - 46 - 34 - 34);

				var containerSide = []
				containerSide[0] = containerMaersk
				containerSide[1] = containerEvergreen

				// Draw a bunch of containers
				for (var x = 101; x >= 6; x--) {
					if (x % 3) {
						x--;
					}
					for (var y = 3; y <= 22; y = y + 3) {
						var track = angular.element(document.querySelector("#track"))[0];
						start = isoConvert(x, y);

						// level 1
						ctx.drawImage(containerSide[rand(0, 1)], start.x + 0, start.y - 46);
						// level 2
						ctx.drawImage(containerSide[rand(0, 1)], start.x + 0, start.y - 46 - 34);
						// level 3
						ctx.drawImage(containerSide[rand(0, 1)], start.x + 0, start.y - 46 - 34 - 34);

					}
				}

			}
		}

		function isoConvert(x, y) {
			var startX = (x * 27) + (y * 27);
			var startY = (x * -16) + (y * 16);

			return {
				x: startX,
				y: startY
			};
		}

		function rand(start, end) {
			return Math.floor(Math.random() * end) + start;
		}


//		function trackTransforms(ctx) {
		$scope.trackTransforms = function (ctx) {
			var svg = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
			var xform = svg.createSVGMatrix();
			ctx.getTransform = function () {
				return xform;
			};

			var savedTransforms = [];
			var save = ctx.save;
			ctx.save = function () {
				savedTransforms.push(xform.translate(0, 0));
				return save.call(ctx);
			};
			var restore = ctx.restore;
			ctx.restore = function () {
				xform = savedTransforms.pop();
				return restore.call(ctx);
			};

			var scale = ctx.scale;
			ctx.scale = function (sx, sy) {
				xform = xform.scaleNonUniform(sx, sy);
				return scale.call(ctx, sx, sy);
			};
			var rotate = ctx.rotate;
			ctx.rotate = function (radians) {
				xform = xform.rotate(radians * 180 / Math.PI);
				return rotate.call(ctx, radians);
			};
			var translate = ctx.translate;
			ctx.translate = function (dx, dy) {
				xform = xform.translate(dx, dy);
				return translate.call(ctx, dx, dy);
			};
			var transform = ctx.transform;
			ctx.transform = function (a, b, c, d, e, f) {
				var m2 = svg.createSVGMatrix();
				m2.a = a;
				m2.b = b;
				m2.c = c;
				m2.d = d;
				m2.e = e;
				m2.f = f;
				xform = xform.multiply(m2);
				return transform.call(ctx, a, b, c, d, e, f);
			};
			var setTransform = ctx.setTransform;
			ctx.setTransform = function (a, b, c, d, e, f) {
				xform.a = a;
				xform.b = b;
				xform.c = c;
				xform.d = d;
				xform.e = e;
				xform.f = f;
				return setTransform.call(ctx, a, b, c, d, e, f);
			};
			var pt = svg.createSVGPoint();
			ctx.transformedPoint = function (x, y) {
				pt.x = x;
				pt.y = y;
				return pt.matrixTransform(xform.inverse());
			}
		}

		$scope.trackTransforms(ctx);
		$scope.init();
	}])
.controller('YardCtrl', ['$scope', 'auth', function($scope, auth) {



}]);


