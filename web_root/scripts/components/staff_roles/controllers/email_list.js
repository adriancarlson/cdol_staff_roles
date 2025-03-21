'use strict'
define(require => {
	const module = require('components/staff_roles/module')

	module.controller('emailListCtrl', [
		'$scope',
		'$attrs',
		'$http',
		'$q',
		function ($scope, $attrs, $http, $q) {
			$scope.hello = 'world'
			$scope.curSchoolId = $attrs.ngCurSchoolId
			$scope.setShowColumns = () => {
				$scope.showColumns = {
					Name: true
				}
				if ($scope.curSchoolId == 0) {
					$scope.showColumns['School'] = true
				}
			}

			//This is here for troubleshooting purposes.
			//Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.loadData = () => {
				loadingDialog()
				$scope.setShowColumns()

				$q.all([$http.get('json/rolesData.json'), $http.get('json/staffData.json')])
					.then(([rolesRes, staffRes]) => {
						$scope.rolesData = rolesRes.data
						$scope.staffData = staffRes.data

						$scope.schoolStaffDCIDs = $scope.staffData.map(staff => staff.school_staff_dcid)

						return $http({
							url: 'json/staffRoles.json',
							method: 'GET',
							params: { schoolStaffDCIDs: $scope.schoolStaffDCIDs.join(',') }
						})
					})
					.then(staffRolesRes => {
						$scope.allRoles = staffRolesRes.data

						// Create emailListData with staff_roles attached
						$scope.emailListData = $scope.staffData.map(staff => {
							const staffDCID = staff.school_staff_dcid

							// Find matching roles
							const roles = $scope.allRoles.filter(role => role.schoolstaffdcid === staffDCID).sort((a, b) => parseInt(a.priority) - parseInt(b.priority))

							// Create comma-separated string of displayvalue
							const roleString = roles.map(r => r.displayvalue).join(', ')

							return {
								...staff,
								staff_roles: roleString
							}
						})

						closeLoading()
					})
					.catch(err => {
						console.error('Error loading data:', err)
						closeLoading()
					})
			}
			$scope.loadData()
		}
	])
})
