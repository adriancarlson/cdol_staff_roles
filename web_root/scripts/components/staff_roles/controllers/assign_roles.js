'use strict'
define(require => {
	const module = require('components/staff_roles/module')

	module.controller('assignRolesCtrl', [
		'$scope',
		'$attrs',
		'$http',
		function ($scope, $attrs, $http) {
			$scope.testMessage = 'Hello World!'

			$scope.curSchoolId = $attrs.ngCurSchoolId

			//This is here for troubleshooting purposes.
			//Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.toggleIncludeAllStaff = () => {
				$scope.includeAllStaff = !$scope.includeAllStaff
				$scope.showColumns['School'] = $scope.includeAllStaff
				$scope.loadGridData()
			}

			$scope.loadGridData = () => {
				loadingDialog()

				closeLoading()
			}
		}
	])
})
