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
			$scope.rolePayload = {
				SchoolStaffDCID: $scope.schoolStaffDcid,
				schoolid: $scope.curSchoolId,
				cdol_role: '',
				priority: '1'
			}

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
						const rolesResponse = responses[0]
						const staffResponse = responses[1]

						// Process roles data
						const allRolesData = psUtils.htmlEntitiesToCharCode(rolesResponse.data).sort((a, b) => a.uidisplayorder - b.uidisplayorder)

						// Process staff roles data
						const staffRolesData = psUtils.htmlEntitiesToCharCode(staffResponse.data)

						// Filter rolesData to exclude roles already in staffRolesData
						$scope.rolesData = allRolesData.filter(role => {
							return !staffRolesData.some(staffRole => staffRole.cdol_role === role.code)
						})

						// Assign staffRolesData to scope
						$scope.staffRolesData = staffRolesData
					})
					.catch(err => {
						console.error('Error loading data:', err)
					})
					.finally(() => {
						closeLoading()
					})
			}
			$scope.loadGridData()

			$scope.submitStaffRole = () => {
				let newRecord = {
					tables: {
						U_CDOL_STAFF_ROLES: $scope.rolePayload
					}
				}
				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_ROLES',
					method: 'POST',
					data: newRecord,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					}
				}).then(response => {
					if (response.data.result[0].status == 'SUCCESS') {
						$scope.loadGridData()
					} else {
						psAlert({ message: 'There was an error submitting the record. Changes were not saved', title: 'Error Submitting Record' })
					}
				})
			}
			$scope.removeStaffRole = id => {
				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_ROLES/' + id,
					method: 'DELETE',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json'
					}
				}).then(res => {
					$scope.loadGridData()
				})
			}
		}
	])
})
