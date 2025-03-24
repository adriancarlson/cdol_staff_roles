'use strict'
define(require => {
	const module = require('components/staff_roles/module')

	module.controller('emailListCtrl', [
		'$scope',
		'$attrs',
		'$http',
		'$q',
		function ($scope, $attrs, $http, $q) {
			// End multiselect function code
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

						$scope.schoolsMap = {}
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

						// Group staffData by user_dcid
						const groupedStaffMap = {}

						$scope.staffData.forEach(staff => {
							const userDCID = staff.user_dcid
							if (!groupedStaffMap[userDCID]) {
								groupedStaffMap[userDCID] = {
									...staff,
									school_abbrs: [],
									school_names: [],
									school_numbers: [],
									school_staff_dcids: []
								}
							}
							groupedStaffMap[userDCID].school_abbrs.push(staff.school_abbr)
							groupedStaffMap[userDCID].school_names.push({
								name: staff.school_name,
								number: staff.school_number
							})
							groupedStaffMap[userDCID].school_numbers.push(staff.school_number)
							groupedStaffMap[userDCID].school_staff_dcids.push(staff.school_staff_dcid)
						})

						// Convert grouped map to array
						$scope.emailListData = Object.values(groupedStaffMap).map(group => {
							// Sort school_names alphabetically
							const sortedSchools = group.school_names.sort((a, b) => a.name.localeCompare(b.name))
							const sortedSchoolNames = sortedSchools.map(s => s.name)
							const sortedSchoolAbbrs = sortedSchools.map(s => {
								const idx = group.school_names.findIndex(orig => orig.name === s.name)
								return group.school_abbrs[idx]
							})
							const sortedSchoolNumbers = sortedSchools.map(s => s.number)

							// Flatten school_staff_dcids for role lookup
							const roleList = group.school_staff_dcids.flatMap(schoolStaffDCID => $scope.staffRolesData.filter(role => role.schoolstaffdcid === schoolStaffDCID))

							// Sort roles by priority and create display string
							const sortedRoles = roleList.sort((a, b) => parseInt(a.priority) - parseInt(b.priority))
							const roleString = sortedRoles.map(r => r.displayvalue).join(', ')

							const roleFlags = {}
							sortedRoles.forEach(role => {
								roleFlags[role.cdol_role] = true
							})

							return {
								...group,
								school_abbr: sortedSchoolAbbrs.join(', '),
								school_name: sortedSchoolNames.join(', '),
								school_number: sortedSchoolNumbers.join(', '),
								staff_roles: roleString,
								roles: roleFlags
							}
						})
						// Add multiselect function to each staff entry using ES6+
						const multiselectRolesFunction = stringDescriptor => {
							return !!this.roles?.[stringDescriptor]
						}

						// Add multiselect function to each staff entry using ES6+
						const multiselectSchoolsFunction = stringDescriptor => {
							return !!this.school_name?.[stringDescriptor]
						}

						$scope.emailListData.forEach(staff => {
							staff.multiselectRolesFunction = multiselectRolesFunction
							staff.multiselectSchoolsFunction = multiselectSchoolsFunction
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
