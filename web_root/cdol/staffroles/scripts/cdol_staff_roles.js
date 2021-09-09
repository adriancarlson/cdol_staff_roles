define(['angular', 'components/shared/index'], function (angular) {
	var cdolRolesApp = angular.module('cdolRolesApp', ['powerSchoolModule']);
	cdolRolesApp.controller('cdolRolesAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		function ($scope, $http, $attrs) {
			$scope.cdolRole = {
				SchoolStaffDCID: $attrs.ngUserId,
				schoolid: $attrs.ngCurSchoolId,
				cdol_role: '',
				priority: '1',
			};
			$scope.roleList = [];
			$scope.rolesDropDownList = [];

			$scope.invalidNew = function () {
				if ($scope.cdolRole.cdol_role === '') {
					return true;
				}
				if ($scope.rolesDropDownList.length < 1) {
					return true;
				}
			};

			$scope.getRolesDropDown = function () {
				$http({
					url: '/admin/cdol/staffroles/data/getRolesDropDown.json',
					method: 'GET',
					params: { SchoolStaffDCID: $attrs.ngUserId, curSchoolID: $attrs.ngCurSchoolId },
				}).then(function (response) {
					$scope.rolesDropDownList = response.data;
					$scope.rolesDropDownList.pop();
					$scope.cdolRole.cdol_role = '';
				});
			};

			$scope.getExistingRoles = function () {
				$http({
					url: '/admin/cdol/staffroles/data/getExistingRoles.json',
					method: 'GET',
					params: { SchoolStaffDCID: $attrs.ngUserId, curSchoolID: $attrs.ngCurSchoolId },
				}).then(function (response) {
					$scope.roleList = response.data;
					$scope.roleList.pop();
					$scope.getRolesDropDown();
				});
			};

			$scope.submitStaffRole = function () {
				let newRecord = {
					tables: {
						U_CDOL_STAFF_ROLES: $scope.cdolRole,
					},
				};

				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_ROLES',
					method: 'POST',
					data: newRecord,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(function (response) {
					if (response.data.result[0].status == 'SUCCESS') {
						$scope.getExistingRoles();
					} else {
						psAlert({ message: 'There was an error submitting the record. Changes were not saved', title: 'Error Submitting Record' });
					}
				});
			};

			$scope.removeStaffRole = function (id) {
				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_ROLES/' + id,
					method: 'DELETE',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(function mySuccess(response) {
					$scope.getExistingRoles();
				});
			};
		},
	]);
});
