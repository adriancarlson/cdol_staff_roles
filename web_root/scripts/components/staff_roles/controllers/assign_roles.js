'use strict'
define(require => {
	const module = require('components/staff_roles/module')

	module.controller('assignRolesCtrl', [
		'$scope',
		'$attrs',
		'$http',
		'$q', // Corrected from #q to $q
		function ($scope, $attrs, $http, $q) {
			$scope.curSchoolId = $attrs.ngCurSchoolId
			$scope.schoolStaffDcid = $attrs.ngSchoolStaffDcid

			// This is here for troubleshooting purposes.
			// Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.loadGridData = () => {
				loadingDialog()

				// Use $q.all to handle multiple HTTP requests
				$q.all([
					$http.get('/admin/staff_roles/json/rolesData.json'),
					$http.get('/admin/staff_roles/json/staffRoles.json', {
						params: { curSchoolIds: $scope.curSchoolId, schoolStaffDCIDs: $scope.schoolStaffDcid }
					})
				])
					.then(responses => {
						const rolesResponse = responses[0];
						const staffResponse = responses[1];

						// Process roles data
						const allRolesData = psUtils.htmlEntitiesToCharCode(rolesResponse.data).sort(
							(a, b) => a.uidisplayorder - b.uidisplayorder
						);

						// Process staff roles data
						const staffRolesData = psUtils.htmlEntitiesToCharCode(staffResponse.data);

						// Filter rolesData to exclude roles already in staffRolesData
						$scope.rolesData = allRolesData.filter(role => {
							return !staffRolesData.some(staffRole => staffRole.cdol_role === role.code);
						});

						// Assign staffRolesData to scope
						$scope.staffRolesData = staffRolesData;
					})
					.catch(err => {
						console.error('Error loading data:', err);
					})
					.finally(() => {
						closeLoading();
					});
			}
			$scope.loadGridData()
		}
	])
})
