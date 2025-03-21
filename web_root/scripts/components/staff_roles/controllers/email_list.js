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

			$scope.loadData = () => {
				loadingDialog()
				$scope.setShowColumns()

				// Fetch rolesData and staffData in parallel
				$q.all([$http.get('json/rolesData.json'), $http.get('json/staffData.json')])
					.then(([rolesRes, staffRes]) => {
						$scope.rolesData = rolesRes.data
						$scope.staffData = staffRes.data

						// Extract DCIDs after staffData is set
						$scope.schoolStaffDCIDs = $scope.staffData.map(staff => staff.school_staff_dcid)

						// Now fetch staffRoles using schoolStaffDCIDs
						return $http({
							url: 'json/staffRoles.json',
							method: 'GET',
							params: { schoolStaffDCIDs: $scope.schoolStaffDCIDs.join(',') }
						})
					})
					.then(staffRolesRes => {
						// staffRolesRes contains the roles if you want to use it
						$scope.emailListData = $scope.staffData
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
