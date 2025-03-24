'use strict'
define(require => {
	const module = require('components/staff_roles/module')

	module.controller('emailListCtrl', [
		'$scope',
		'$attrs',
		'$http',
		'$q',
		function ($scope, $attrs, $http, $q) {
			$scope.curSchoolId = $attrs.ngCurSchoolId

			//This is here for troubleshooting purposes.
			//Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.loadData = () => {
				loadingDialog()
				$scope.showColumns = {}
				if ($scope.curSchoolId == 0) {
					$scope.showColumns['School'] = true
				}

				$q.all([$http.get('json/rolesData.json'), $http.get('json/staffData.json')])
					.then(([rolesRes, staffRes]) => {
						$scope.rolesData = rolesRes.data
						$scope.staffData = staffRes.data
						$scope.roleMap = {}
						$scope.schoolMap = {}
						$scope.rolesData.forEach(role => {
							$scope.roleMap[role.displayvalue] = role.code
						})

						$scope.staffData.forEach(staff => {
							$scope.schoolMap[staff.school_name] = staff.school_name
						})

						$scope.schoolStaffDCIDs = $scope.staffData.map(staff => staff.school_staff_dcid).slice(0, 999)

						return $http({
							url: 'json/staffRoles.json',
							method: 'GET',
							params: { schoolStaffDCIDs: $scope.schoolStaffDCIDs.join(',') }
						})
					})
					.then(staffRolesRes => {
						$scope.staffRolesData = staffRolesRes.data

						// Create emailListData with staff_roles attached
						$scope.emailListData = $scope.staffData.map(staff => {
							const staffDCID = staff.school_staff_dcid

							// Find matching roles
							const roles = $scope.staffRolesData.filter(role => role.schoolstaffdcid === staffDCID).sort((a, b) => parseInt(a.uidisplayorder) - parseInt(b.uidisplayorder))

							// Create comma-separated string of displayvalue
							const roleString = roles.map(r => r.displayvalue).join(', ')

							// Key-value object for cdol_role presence
							const roleFlags = {}
							roles.forEach(role => {
								roleFlags[role.cdol_role] = true
							})

							return {
								...staff,
								staff_roles: roleString,
								roles: roleFlags
							}
						})

						// Add multiselect function to each staff entry using ES6+
						const multiselectRolesFunction = function (stringDescriptor) {
							return !!this.roles?.[stringDescriptor]
						}

						$scope.emailListData.forEach(staff => {
							staff.multiselectRolesFunction = multiselectRolesFunction
							staff.isSelected = true
						})

						closeLoading()
					})
					.catch(err => {
						console.error('Error loading data:', err)
						closeLoading()
					})
			}
			$scope.loadData()
			$scope.toggleAllSelected = true

			$scope.toggleAllFilteredStaff = () => {
				if (!$scope.filteredEmailListData) return

				// Toggle the master flag first
				$scope.toggleAllSelected = !$scope.toggleAllSelected

				// Apply the new toggle state to each visible staff
				$scope.filteredEmailListData.forEach(staff => {
					staff.isSelected = $scope.toggleAllSelected
				})
			}

			$scope.generateEmail = () => {
				$scope.createEmailList()
				const bcc = encodeURIComponent($scope.selectedEmailList)
				const mailtoLink = `mailto:?bcc=${bcc}`
				window.location.href = mailtoLink
			}
			$scope.copyEmailList = () => {
				$scope.createEmailList()
				console.log(selectedEmailList)
			}

			$scope.createEmailList = () => {
				if (!$scope.filteredEmailListData) return
				$scope.selectedEmailList = Array.from(new Set($scope.filteredEmailListData.filter(staff => staff.isSelected && staff.email_addr).map(staff => staff.email_addr))).join(', ')
			}
		}
	])
})
