define(['angular', 'components/shared/index'], function (angular) {
	var cdolRolesApp = angular.module('cdolRolesApp', ['powerSchoolModule']);
	cdolRolesApp.controller('cdolRolesAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		function ($scope, $http, $attrs) {
			
			$scope.roleList = [];
			$scope.rolesDropDownList = [];

			$scope.getRolesDropDown = function () {
				$http({
					url: '/admin/cdol/staffroles/data/getRolesDropDown.json',
					method: 'GET',
					params: { SchoolStaffDCID: $attrs.ngUserId, curSchoolID: $attrs.ngCurSchoolId },
				}).then(function (response) {
					$scope.rolesDropDownList = response.data;
					$scope.rolesDropDownList.pop();
				});
			};

			$scope.getStaffRoles = function () {
				$http({
					url: '/admin/cdol/staffroles/data/getExistingRoles.json',
					method: 'GET',
					params: { SchoolStaffDCID: $attrs.ngUserId, curSchoolID: $attrs.ngCurSchoolId },
				}).then(function (response) {
					$scope.roleList = response.data;
					$scope.roleList.pop();
				});
			};

			
		},
	]);
});
