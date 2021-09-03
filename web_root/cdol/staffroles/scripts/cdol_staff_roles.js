define(['angular', 'components/shared/index'], function (angular) {
	var cdolRolesApp = angular.module('cdolRolesApp', ['powerSchoolModule']);
	cdolRolesApp.controller('cdolRolesAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		function ($scope, $http, $attrs) {
			$scope.cdolRole = {
				udcid: '',
				schoolid: '',
				cdolrole: '',
				priority: 1,
			};

			$scope.getExistingRoles = function () {
				$http({
					url: '/admin/cdol/staffroles/data/getExistingRoles.json',
					method: 'GET',
					params: { udcid: $attrs.ngCurUserId, curSchoolID: $attrs.ngCurSchoolId },
				}).then(function (response) {
					roleList = response.data;
					roleList.pop();
				});
			};
		},
	]);
});
