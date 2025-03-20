'use strict'
define(require => {
	require('components/shared/index')
	require('components/staff_roles/module')
	require('components/staff_roles/controllers/index')
	//bootstrap
	require(['https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'])
	//select2
	require(['https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js'])
})
