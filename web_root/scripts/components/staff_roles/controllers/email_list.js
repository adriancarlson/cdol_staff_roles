'use strict'
define(require => {
	const module = require('components/staff_roles/module')

	module.controller('emailListCtrl', [
		'$scope',
		'$attrs',
		'$http',
		function ($scope, $attrs, $http) {
			$scope.hello = 'world'
			$scope.curSchoolId = $attrs.ngCurSchoolId
		}
	])
})
