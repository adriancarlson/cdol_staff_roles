define(['angular', 'components/shared/index'], function (angular) {
	var cdolRolesApp = angular.module('cdolRolesApp', ['powerSchoolModule']);
	cdolRolesApp.controller('cdolRolesAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		function ($scope, $http, $attrs) {
			$scope.cdolRole = {
				SchoolStaffDCID: $attrs.ngCurUserId,
				schoolid: $attrs.ngCurSchoolId,
				cdol_role: '',
				priority: '1',
			};

			$scope.getExistingRoles = function () {
				$http({
					url: '/admin/cdol/staffroles/data/getExistingRoles.json',
					method: 'GET',
					params: { SchoolStaffDCID: $attrs.ngCurUserId, curSchoolID: $attrs.ngCurSchoolId },
				}).then(function (response) {
					roleList = response.data;
					roleList.pop();
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
						console.log('sucess');
						getExistingRoles();
					} else {
						psAlert({ message: 'There was an error submitting the record. Changes were not saved', title: 'Error Submitting Record' });
					}
				});
			};
		},
	]);
});
