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
					height: 550,
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
			$scope.rolesData = []
			$scope.roleMap = {}

			if ($scope.curSchoolId == 0) {
				$scope.includeAllStaff = true
			}
			$scope.schoolMap = {
				'All Saints Catholic School Holdrege': 'All Saints Catholic School Holdrege',
				'Aquinas Catholic Elementary': 'Aquinas Catholic Elementary',
				'Aquinas Catholic Middle/High': 'Aquinas Catholic Middle/High',
				'Bishop Neumann Catholic Jr/Sr High School': 'Bishop Neumann Catholic Jr/Sr High School',
				'Blessed Sacrament School': 'Blessed Sacrament School',
				'Cathedral of the Risen Christ School': 'Cathedral of the Risen Christ School',
				'Falls City Sacred Heart Elementary': 'Falls City Sacred Heart Elementary',
				'Falls City Sacred Heart Jr/Sr High School': 'Falls City Sacred Heart Jr/Sr High School',
				'Lourdes Central Catholic Elementary School': 'Lourdes Central Catholic Elementary School',
				'Lourdes Central Catholic Middle/High School': 'Lourdes Central Catholic Middle/High School',
				'North American Martyrs School': 'North American Martyrs School',
				'Pius X High School': 'Pius X High School',
				'St. Andrew Tecumseh': 'St. Andrew Tecumseh',
				'St. Cecilia Middle & High School': 'St. Cecilia Middle & High School',
				'St. James Crete': 'St. James Crete',
				'St. John Lincoln': 'St. John Lincoln',
				'St. John Nepomucene Weston': 'St. John Nepomucene Weston',
				'St. John the Baptist School': 'St. John the Baptist School',
				'St. Joseph Beatrice': 'St. Joseph Beatrice',
				'St. Joseph Lincoln': 'St. Joseph Lincoln',
				'St. Joseph York': 'St. Joseph York',
				'St. Michael Hastings': 'St. Michael Hastings',
				'St. Michael Lincoln': 'St. Michael Lincoln',
				'St. Patrick Lincoln': 'St. Patrick Lincoln',
				'St. Patrick McCook': 'St. Patrick McCook',
				'St. Peter Catholic School': 'St. Peter Catholic School',
				'St. Teresa Elementary School': 'St. Teresa Elementary School',
				'St. Vincent de Paul Seward': 'St. Vincent de Paul Seward',
				'St. Wenceslaus Wahoo': 'St. Wenceslaus Wahoo',
				'Villa Marie School': 'Villa Marie School'
			}

			const schoolSwitchMap = {
				130: '131',
				131: '130',
				210: '211',
				211: '210',
				264: '160',
				160: '264',
				189: '437',
				437: '189'
			}

			$http
				.get('json/rolesData.json')
				.then(res => {
					$scope.rolesData = psUtils.htmlEntitiesToCharCode(res.data)
					$scope.roleMap = {}

					$scope.rolesData
						.sort((a, b) => a.uidisplayorder - b.uidisplayorder)
						.forEach(role => {
							$scope.roleMap[role.displayvalue] = role.code
						})

					$scope.roleMap['No Roles'] = 'none'

					// After roles are ready, load the rest of the data
					$scope.loadGridData()
				})
				.catch(err => {
					console.error('Error loading roles data:', err)
				})

			//This is here for troubleshooting purposes.
			//Allows us to double click anywhere on the page and logs scope to console
			$j(document).dblclick(() => console.log($scope))

			$scope.toggleIncludeAllStaff = () => {
				$scope.includeAllStaff = !$scope.includeAllStaff
				if ($scope.includeAllStaff) {
					$scope.includeOtherSchool = false // Reset the "Show Other School" switch
				}
				$scope.showColumns['School'] = $scope.includeAllStaff
				$scope.loadGridData()
			}

			$scope.toggleIncludeOtherSchool = () => {
				$scope.includeOtherSchool = !$scope.includeOtherSchool

				if ($scope.includeOtherSchool) {
					$scope.includeAllStaff = false
					// Append the mapped school ID to curSchoolId as a comma-separated list
					const otherSchoolId = schoolSwitchMap[$scope.curSchoolId]
					if (otherSchoolId) {
						$scope.curSchoolId = `${$scope.curSchoolId},${otherSchoolId}`
					}
				} else {
					// Reset curSchoolId to its original value
					$scope.curSchoolId = $attrs.ngCurSchoolId
				}

				$scope.showColumns['School'] = $scope.includeOtherSchool
				$scope.loadGridData()
			}

			$scope.loadGridData = () => {
				loadingDialog()

				if ($scope.includeAllStaff) {
					$scope.showColumns['School'] = true
				}
				let paramSchoolIds
				if ($scope.includeAllStaff) {
					paramSchoolIds = 0
				} else {
					paramSchoolIds = $scope.curSchoolId
				}
				const getBatchedStaffRoles = (dcids, batchSize = 1000) => {
					const requests = []
					for (let i = 0; i < dcids.length; i += batchSize) {
						const batch = dcids.slice(i, i + batchSize)
						requests.push(
							$http({
								url: 'json/staffRoles.json',
								method: 'GET',
								params: { curSchoolIds: paramSchoolIds, schoolStaffDCIDs: batch.join(',') }
							})
						)
					}
					return $q.all(requests).then(responses => {
						return responses.flatMap(res => psUtils.htmlEntitiesToCharCode(res.data))
					})
				}

				$http
					.get('json/staffData.json', { params: { curSchoolIds: paramSchoolIds } })
					.then(staffRes => {
						$scope.staffData = psUtils.htmlEntitiesToCharCode(staffRes.data)
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
						$scope.curSchoolId = $attrs.ngCurSchoolId
						closeLoading()
					})
					.catch(err => {
						console.error('Error loading data:', err)
						$scope.curSchoolId = $attrs.ngCurSchoolId
						closeLoading()
					})
			}

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
				}, 10000)
			}

			$scope.createEmailList = () => {
				if (!$scope.filteredEmailListData) return
				const emails = Array.from(new Set($scope.filteredEmailListData.filter(staff => staff.isSelected && staff.email_addr).map(staff => staff.email_addr)))

				$scope.selectedEmailList = emails.join(', ')
				$scope.selectedEmailCount = emails.length

				$scope.openDialog()
			}
		}
	])
})
