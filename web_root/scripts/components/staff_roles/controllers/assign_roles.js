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
			$scope.schoolStaffDCID = $attrs.schoolStaffDCID

			// This is here for troubleshooting purposes.
			// Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.loadGridData = () => {
				loadingDialog()

				// Use $q.all to handle multiple HTTP requests
				$q.all([
					$http.get('/admin/staff_roles/json/rolesData.json'),
					$http.get('/admin/staff_roles/json/staffRoles.json', {
						params: { curSchoolIds: $scope.curSchoolId, schoolStaffDCID: $scope.schoolStaffDCID }
					})
				])
					.then(responses => {
						const rolesResponse = responses[0]
						const staffResponse = responses[1]

						// Process roles data
						$scope.rolesData = psUtils.htmlEntitiesToCharCode(rolesResponse.data).sort((a, b) => a.uidisplayorder - b.uidisplayorder)

						// Process staff roles data
						$scope.staffRolesData = psUtils.htmlEntitiesToCharCode(staffResponse.data)
					})
					.catch(err => {
						console.error('Error loading data:', err)
					})
					.finally(() => {
						closeLoading()
					})
			}
		}
	])
})
