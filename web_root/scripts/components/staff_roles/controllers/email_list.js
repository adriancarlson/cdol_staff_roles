'use strict'
define(require => {
	const module = require('components/staff_roles/module')

	module.controller('emailListCtrl', [
		'$scope',
		'$attrs',
		'$http',
		'$q',
		'$timeout',
		function ($scope, $attrs, $http, $q, $timeout) {
			let psDialogHolder = null

			$scope.openDialog = () => {
				psDialogHolder = $j('#dialogPopUp').detach()

				psDialog({
					type: 'dialogR',
					width: 850,
					title: 'Email List',
					content: psDialogHolder,
					close: () => {
						// Move View back to a holder so that it won't be lost if another type of dialog is opened.
						$j(`#dialogContainer`).append(psDialogHolder)
					}
				})
			}

			$scope.curSchoolId = $attrs.ngCurSchoolId
			$scope.includeAllStaff = false
			$scope.showColumns = {}

			if ($scope.curSchoolId == 0) {
				$scope.includeAllStaff = true
			}

			//This is here for troubleshooting purposes.
			//Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.initializeEmailListApp = () => {
				loadingDialog()
				$scope.loadRolesData()
				$scope.loadGridData()
				closeLoading()
			}
			$scope.loadRolesData = () => {
				loadingDialog()
				closeLoading()
			}

			$scope.loadGridData = () => {
				loadingDialog()

				if ($scope.includeAllStaff) {
					$scope.showColumns['School'] = true
				}

				const getBatchedStaffRoles = (dcids, batchSize = 1000) => {
					const requests = []
					for (let i = 0; i < dcids.length; i += batchSize) {
						const batch = dcids.slice(i, i + batchSize)
						requests.push(
							$http({
								url: 'json/staffRoles.json',
								method: 'GET',
								params: { schoolStaffDCIDs: batch.join(',') }
							})
						)
					}
					return $q.all(requests).then(responses => {
						return responses.flatMap(res => psUtils.htmlEntitiesToCharCode(res.data))
					})
				}

				$q.all([$http.get('json/rolesData.json'), $http.get('json/staffData.json')])
					.then(([rolesRes, staffRes]) => {
						$scope.rolesData = psUtils.htmlEntitiesToCharCode(rolesRes.data)
						$scope.staffData = psUtils.htmlEntitiesToCharCode(staffRes.data)

						$scope.roleMap = {}
						$scope.rolesData
							.sort((a, b) => a.uidisplayorder - b.uidisplayorder)
							.forEach(role => {
								$scope.roleMap[role.displayvalue] = role.code
							})
						$scope.roleMap['No Roles'] = 'none'

						$scope.schoolMap = {}
						$scope.staffData
							.slice() // clone array to avoid mutating original
							.sort((a, b) => a.school_name.localeCompare(b.school_name))
							.forEach(staff => {
								$scope.schoolMap[staff.school_name] = staff.school_name
							})

						$scope.schoolStaffDCIDs = $scope.staffData.map(staff => staff.school_staff_dcid)

						return getBatchedStaffRoles($scope.schoolStaffDCIDs)
					})
					.then(allStaffRoles => {
						$scope.staffRolesData = allStaffRoles

						const rawEmailList = $scope.staffData.map(staff => {
							const staffDCID = staff.school_staff_dcid
							const userDCID = staff.user_dcid

							const roles = $scope.staffRolesData.filter(role => role.schoolstaffdcid === staffDCID).sort((a, b) => parseInt(a.uidisplayorder) - parseInt(b.uidisplayorder))

							const roleString = roles
								.map(r => r.displayvalue)
								.filter(v => typeof v === 'string' && v.trim().length > 0)
								.map(v => v.trim())
								.join(', ')

							const roleFlags = {}
							roles.forEach(role => {
								roleFlags[role.cdol_role] = true
							})

							return {
								...staff,
								staff_roles: roleString,
								roles: roleFlags,
								isSelected: true
							}
						})

						const mergedMap = {}

						rawEmailList.forEach(entry => {
							const key = entry.user_dcid
							if (!mergedMap[key]) {
								mergedMap[key] = { ...entry }
							} else {
								// Merge school_name
								if (!mergedMap[key].school_name.includes(entry.school_name)) {
									mergedMap[key].school_name += `, ${entry.school_name}`
								}

								// Merge roles
								Object.entries(entry.roles).forEach(([k, v]) => {
									if (v) mergedMap[key].roles[k] = true
								})

								// Merge and sort staff_roles
								const roleSet = new Set()

								// Add current roles
								;(mergedMap[key].staff_roles || '')
									.split(',')
									.map(r => r.trim())
									.filter(Boolean)
									.forEach(r => roleSet.add(r))

								// Add new roles
								;(entry.staff_roles || '')
									.split(',')
									.map(r => r.trim())
									.filter(Boolean)
									.forEach(r => roleSet.add(r))

								const sortedRoles = Array.from(roleSet).sort((a, b) => {
									const aOrder = $scope.rolesData.find(r => r.displayvalue === a)?.uidisplayorder ?? 999
									const bOrder = $scope.rolesData.find(r => r.displayvalue === b)?.uidisplayorder ?? 999
									return parseInt(aOrder) - parseInt(bOrder)
								})

								mergedMap[key].staff_roles = sortedRoles.join(', ')
							}
						})

						$scope.emailListData = Object.values(mergedMap)

						const multiselectRolesFunction = function (stringDescriptor) {
							if (stringDescriptor === 'none') {
								return !this.roles || Object.keys(this.roles).length === 0
							}
							return !!this.roles?.[stringDescriptor]
						}

						const multiselectSchoolsFunction = function (stringDescriptor) {
							return this.school_name?.toLowerCase().includes(stringDescriptor.toLowerCase())
						}

						$scope.emailListData.forEach(staff => {
							staff.multiselectRolesFunction = multiselectRolesFunction
							staff.multiselectSchoolsFunction = multiselectSchoolsFunction
						})

						$scope.toggleAllSelected = true
						closeLoading()
					})
					.catch(err => {
						console.error('Error loading data:', err)
						closeLoading()
					})
			}

			$scope.initializeEmailListApp()

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
				const bcc = encodeURIComponent($scope.selectedEmailList)
				const mailtoLink = `mailto:?bcc=${bcc}`
				window.location.href = mailtoLink
			}

			$scope.copyEmailList = () => {
				const textToCopy = $scope.selectedEmailList
				if (!textToCopy) return

				navigator.clipboard
					.writeText(textToCopy)
					.then(() => console.log('Copied to clipboard'))
					.catch(err => console.error('Failed to copy', err))
				$scope.confirmMessage = true
				psDialogClose()

				$timeout(() => {
					$scope.confirmMessage = false
				}, 5000)
			}

			$scope.createEmailList = () => {
				if (!$scope.filteredEmailListData) return
				$scope.selectedEmailList = Array.from(new Set($scope.filteredEmailListData.filter(staff => staff.isSelected && staff.email_addr).map(staff => staff.email_addr))).join(', ')

				$scope.openDialog()
			}
		}
	])
})
