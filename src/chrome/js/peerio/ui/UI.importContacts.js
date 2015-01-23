Peerio.UI.controller('importContacts', function($scope) {
	'use strict';
	$scope.importContacts = {
		addresses: [],
		checkedAddresses: []
	}

	$scope.$on('importContactsReset', function() {
		$scope.importContacts.addresses = []
		$scope.importContacts.checkedAddresses = []
	})

	$scope.importContacts.onCheck = function(address, event) {
		if (event.target.checked) {
			$scope.importContacts.checkedAddresses.push(address)
		}
		else {
			var index = $scope.importContacts.checkedAddresses.indexOf(address)
			if (index >= 0) {
				$scope.importContacts.checkedAddresses.splice(index, 1)
			}
		}
		console.log($scope.importContacts.checkedAddresses)
	}

	$scope.importContacts.selectAll = function() {
		$('.importContactsSelectContactsCheckbox').each(function() {
			if (!this.checked) {
				$(this).trigger('click')
			}
		});
	}

	$scope.importContacts.importContacts = function() {
		swal({
			title: document.l10n.getEntitySync('importContactsConfirm').value,
			text: document.l10n.getEntitySync('importContactsConfirmText').value,
			type: 'warning',
			showCancelButton: true,
			cancelButtonText: document.l10n.getEntitySync('cancel').value,
			confirmButtonColor: '#e07a66',
			confirmButtonText: document.l10n.getEntitySync('ok').value
		}, function() {
			Peerio.network.addContact($scope.importContacts.checkedAddresses, function(data) {
				$('form.importContactsUploadForm input[type=reset]').trigger('click')
				if (({}).hasOwnProperty.call(data, 'error')) {
					swal({
						title: document.l10n.getEntitySync('importContactsError').value,
						text: document.l10n.getEntitySync('importContactsErrorText').value,
						type: 'error',
						confirmButtonText: document.l10n.getEntitySync('OK').value
					})
				}
				else {
					swal({
						title: document.l10n.getEntitySync('importContactsSuccess').value,
						text: document.l10n.getEntitySync('importContactsSuccessText').value,
						type: 'success',
						confirmButtonText: document.l10n.getEntitySync('OK').value
					})
				}
			})
		})
	}
	
	$('input.importContactsFileSelectDialog').unbind().on('change', function(event) {
		event.preventDefault()
		if (!this.files) {
			return false
		}
		Papa.parse(this.files[0], {
			header: true,
			complete: function(results) {
				results.data.forEach(function(contact) {
					var keys = Object.keys(contact)
					for (var i in keys) {
						if (keys[i].match(/mail/i)) {
							var parsed = Peerio.util.parseAddress(contact[keys[i]])
							if (parsed) {
								$scope.importContacts.addresses.push({
									name: contact['Name'],
									parsed: {
										address: parsed
									}
								})
								continue
							}
						}
					}
				})
				$scope.$apply()
				$('form.importContactsUploadForm input[type=reset]').trigger('click')
			}
		})
	})

})