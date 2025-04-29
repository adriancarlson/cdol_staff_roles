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

			$http
				.get('json/rolesData.json')
				.then(res => {
					$scope.rolesData = psUtils.htmlEntitiesToCharCode(res.data).sort((a, b) => a.uidisplayorder - b.uidisplayorder)

					$scope.loadGridData()
				})
				.catch(err => {
					console.error('Error loading roles data:', err)
				})

			$scope.loadGridData = () => {
				loadingDialog()

				closeLoading()
			}
		}
	])
})
