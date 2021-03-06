define(['angular', 'components/shared/index'], function (angular) {
	var cdolRolesApp = angular.module('cdolRolesApp', ['powerSchoolModule']);
	cdolRolesApp.controller('cdolRolesAppCtrl', [
		'$scope',
		'$http',
		'$attrs',
		function ($scope, $http, $attrs) {
			$scope.cdolRole = {
				SchoolStaffDCID: $attrs.ngUserId,
				schoolid: $attrs.ngCurSchoolId,
				cdol_role: '',
				priority: '1',
			};
			$scope.listPage = $attrs.ngListPage;
			$scope.roleList = [];
			$scope.rolesDropDownList = [];
			$scope.allEmailArray = [];
			$scope.columnChecks = [];
			$scope.timesRun = 0;
			$scope.dioCheck = false;
			$scope.countofColumnChecks = 0;
			$scope.filterCheck = false;

			//makes plus button on CDOL Staff Roles inactive if no option selected or no options left
			$scope.invalidNew = function () {
				if ($scope.cdolRole.cdol_role === '') {
					return true;
				}
				if ($scope.rolesDropDownList.length < 1) {
					return true;
				}
			};
			$scope.updateCheckCount = function (code) {
				$scope.countofColumnChecks = $scope.columnChecks.filter((obj) => obj.val === true).length;
				$scope.getRolesDropDown();
				$scope.catchUnremovedEmails(code);
			};
			//pull in available staff roles for drop down on CDOL Staff Roles. Also utilized for the repeat of column headers on Staff Roles Build Email List. porbably should have been renamed... but not worth the effort at this time.
			$scope.getRolesDropDown = function () {
			    loadingDialog();
				let passedSchoolID = $attrs.ngCurSchoolId;
				if ($scope.dioCheck === true) {
					passedSchoolID = 0;
				}
				$http({
					url: '/admin/cdol/staffroles/data/getRolesDropDown.json',
					method: 'GET',
					params: { SchoolStaffDCID: $attrs.ngUserId, curSchoolID: passedSchoolID },
				}).then(function (response) {
					$scope.rolesDropDownList = response.data;
					$scope.rolesDropDownList.pop();
					//populates the values for the checkboxes to for the ability to choose columns
					if ($scope.listPage === 'true' && $scope.timesRun < 1) {
					    
						$scope.timesRun++;
						$scope.rolesDropDownList.forEach(function (item) {
						$scope.columnChecks.push({ key: item.code, val: true });
					});
						// sets the initial display columns at 4
						$scope.columnChecks.forEach(function (item, index) {
							if ($scope.timesRun === 1) {
								if (index >= 4) {
									item.val = false;
								}
							}
						});
					}
					$scope.getExistingRoles();

					$scope.cdolRole.cdol_role = '';
				});
			};
			//pull in existing  staff roles
			$scope.getExistingRoles = function () {
				$scope.displayEmails = [];
				let passedSchoolID = $attrs.ngCurSchoolId;
				
				if ($scope.dioCheck === true) {
					passedSchoolID = 0;
				}
				
				let rolesToDisplay = [];
				
				if ($scope.listPage === 'true') {
					$scope.columnChecks.forEach(function (item) {
						if (item.val) {
							rolesToDisplay.push("'" + item.key + "'");
						}
					});
					rolesToDisplay = rolesToDisplay.toString();
				}
				$http({
					url: '/admin/cdol/staffroles/data/getExistingRoles.json',
					method: 'GET',
					params: { SchoolStaffDCID: $attrs.ngUserId, curSchoolID: passedSchoolID, displayRoles: rolesToDisplay },
				}).then(function (response) {
					$scope.roleList = response.data;
					$scope.roleList.pop();
					closeLoading();
				});
				
			};
			// API call to add staff role to staff
			$scope.submitStaffRole = function () {
				let newRecord = {
					tables: {
						U_CDOL_STAFF_ROLES: $scope.cdolRole,
					},
				};
				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_ROLES',
					method: 'POST',
					data: newRecord,
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(function (response) {
					if (response.data.result[0].status == 'SUCCESS') {
						$scope.getRolesDropDown();
					} else {
						psAlert({ message: 'There was an error submitting the record. Changes were not saved', title: 'Error Submitting Record' });
					}
				});
			};
			//API call to remove staff role from staff
			$scope.removeStaffRole = function (id) {
				$http({
					url: '/ws/schema/table/U_CDOL_STAFF_ROLES/' + id,
					method: 'DELETE',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
					},
				}).then(function mySuccess(response) {
					$scope.getRolesDropDown();
				});
			};

			// function on each email input to remove email from list
			$scope.checkIndividual = function (uDCID, code) {
				let individualEmailTd = '#' + uDCID + code + 'CheckBox';
				let checkStatus = $j(individualEmailTd).prop('checked');
				let emailColCheck = '.' + uDCID + 'CheckBox';
				let emailsToCheck = $j(emailColCheck);
				//if individual email box checked. check all same individual email boxes and push that email to the allEmailArray
				if (checkStatus) {
					$j(emailsToCheck).prop('checked', true);
					$scope.roleList.forEach(function (item) {
						if (item.usersDCID == uDCID) {
							$scope.allEmailArray.push({ type: item.code, email: item.email_addr, usersDCID: item.usersDCID });
						}
					});
				} else {
					//if individual email box unchecked. uncheck all same individual email boxes and filter out that email from the allEmailArray
					$j(emailsToCheck).prop('checked', false);
					let removedEmailsArray = $scope.allEmailArray.filter(function (item) {
						return item.usersDCID != uDCID;
					});
					$scope.allEmailArray = removedEmailsArray;
				}
				$scope.updateEmailBox();
			};

			// function at top of each roll column on Staff Roles Build Email List togles check mark for individual email checkmarks in the column and adds/removed the emails from the Array.
			$scope.checkAll = function (code) {
				let colCheck = '#' + code + 'SelectedAll';
				let rowCheck = '.' + code + 'CheckBox';
				let masterCheck = $j(colCheck).prop('checked');
				//if column header box checked. check individual email boxes and push that email to the allEmailArray
				if (masterCheck) {
					$j(rowCheck).prop('checked', true);
					$scope.roleList.forEach(function (item) {
						if (item.code == code) {
							$scope.allEmailArray.push({ type: item.code, email: item.email_addr, usersDCID: item.usersDCID });
						}
					});
				} else {
					//if column header box unchecked. uncheck individual email boxes and filter out that email from the allEmailArray
					$j(rowCheck).prop('checked', false);
					let removedEmailsArray = $scope.allEmailArray.filter(function (item) {
						return item.type != code;
					});
					$scope.allEmailArray = removedEmailsArray;
				}
				$scope.updateEmailBox();
			};
            // this function removes any emails the user had selected in the column if they then decied to remove the columns
            $scope.catchUnremovedEmails = function(code){
                let colCheck = '#' + code + 'SelectedAll';
				let rowCheck = '.' + code + 'CheckBox';
				let masterCheck = $j(colCheck).prop('checked');
				if(masterCheck){
				    $j(rowCheck).prop('checked', false);
					let removedEmailsArray = $scope.allEmailArray.filter(function (item) {
						return item.type != code;
					});
					$scope.allEmailArray = removedEmailsArray;
				}
				$scope.updateEmailBox();
            }
            
			$scope.updateEmailBox = function () {
				//turns allEmailArray into justEmailsArray that only has the emails nothing else
				let justEmailsArray = $scope.allEmailArray.map((item) => {
					return item.email;
				});
				//filters out duplicate emails and sets the contents of the emailbox.
				let uniqueEmailsArray = [];

				justEmailsArray.forEach((e) => {
					if (!uniqueEmailsArray.includes(e)) {
						uniqueEmailsArray.push(e);
					}
				});
				let emailsToString = uniqueEmailsArray.toString().replace(/[,]/g, ';');
				$scope.displayEmails = emailsToString;
			};
			//depricated functionaily to set emails to clipboard ... probably should be updated to use the clipboard API at some point
			$scope.copyEmails = function () {
				copyEmailBox.select();
				document.execCommand('copy');
				alert('The addresses have been copied to your clipboard');
			};
		},
	]);
});
