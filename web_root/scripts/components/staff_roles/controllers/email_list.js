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
				$http({ url: 'json/rolesData.json', method: 'GET' }).then(res => {
					$scope.rolesData = res.data
					$http({ url: 'json/staffData.json', method: 'GET' }).then(res => {
						$scope.staffData = res.data
						$scope.schoolStaffDCIDs = $scope.staffData.map(staff => staff.school_staff_dcid)
						$http({
							url: 'json/staffRoles.json',
							method: 'GET',
							params: { schoolStaffDCIDs: schoolStaffDCIDs }
						}).then(res => {
							$scope.emailListData = $scope.staffData
							closeLoading()
						})
					})
				})
			}
			$scope.loadData()
		}
	])
})
