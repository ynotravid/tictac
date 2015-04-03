var app = angular.module('flapperNews',['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function($stateProvider, $urlRouterProvider) {
		$stateProvider
		.state(
			'home',
			{
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl'
			}
		).state(
			'posts',
			{
				url:'/posts/{id}',
				templateUrl: '/posts.html',
				controller: 'PostsCtrl'
			}
		);
		$urlRouterProvider.otherwise('home');
	}
])
.factory('posts', [function(){
	var o = {
		'posts': [
			{'title': 'post 1', 'upvotes':5},
			{'title': 'post 2', 'upvotes':2},
			{'title': 'post 3', 'upvotes':15},
			{'title': 'post 4', 'upvotes':9},
			{'title': 'post 5', 'upvotes':4},
		]

	};
	return o;
}])
.controller('MainCtrl', ['$scope', 'posts',
	function($scope, posts){
		$scope.title = 'Hello there';
		$scope.posts = posts.posts;

		$scope.addPost = function(post) {
			if (!$scope.title) {return;}
			$scope.posts.push({
				title: $scope.title, 
				link: $scope.link,
				upvotes: 0
			});
			$scope.title = '';
			$scope.link = '';

$scope.posts.push({
  title: $scope.title,
  link: $scope.link,
  upvotes: 0,
  comments: [
    {author: 'Joe', body: 'Cool post!', upvotes: 0},
    {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
  ]
});


		};

		$scope.incrementUpvotes = function(post) {
			post.upvotes++;
		};
	}
])
.controller('PostsCtrl', ['$scope', '$stateParams', 'posts', function($scope, $stateParams, posts) {
	$scope.post = posts.posts[$stateParams.id];

$scope.addComment = function(){
  if($scope.body === '') { return; }
  $scope.post.comments.push({
    body: $scope.body,
    author: 'user',
    upvotes: 0
  });
  $scope.body = '';
};


}]);


