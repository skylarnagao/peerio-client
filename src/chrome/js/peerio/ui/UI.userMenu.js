Peerio.UI.controller('userMenu', function($scope) {
	'use strict';
	$scope.userMenu = {}
	Peerio.UI.userMenuPopulate = function() {
		var avatar = Peerio.crypto.getAvatar(
			Peerio.user.username,
			Peerio.user.miniLockID
		)
		$scope.userMenu.avatarIcon1 = 'data:image/png;base64,' + new Identicon(
			avatar[0].substring(0, 16), 30
		).toString()
		$scope.userMenu.avatarIcon2 = 'data:image/png;base64,' + new Identicon(
			avatar[0].substring(16, 32), 30
		).toString()
		$scope.userMenu.avatarIcon3 = 'data:image/png;base64,' + new Identicon(
			avatar[1].substring(0, 16), 30
		).toString()
		$scope.userMenu.avatarIcon4 = 'data:image/png;base64,' + new Identicon(
			avatar[1].substring(16, 32), 30
		).toString()
		if (Peerio.user.firstName.length >= 11) {
			$scope.userMenu.firstName = Peerio.user.firstName.substring(0, 8) + '..'
		}
		else {
			$scope.userMenu.firstName = Peerio.user.firstName
		}
		$scope.$apply()
	}
	$scope.userMenu.openAccountSettings = function() {
		if ($('div.frontModalsWrapper').hasClass('visible')) {
			return false
		}
		$('div.frontModalsWrapper').addClass('visible')
		$('div.accountSettings').addClass('visible')
		$('div.mainTopUserMenu').mouseleave()
		$scope.$root.$broadcast('accountSettingsPopulate', null)
	}
	$scope.userMenu.openPreferences = function() {
		if ($('div.frontModalsWrapper').hasClass('visible')) {
			return false
		}
		$('div.frontModalsWrapper').addClass('visible')
		$('div.preferences').addClass('visible')
		$('div.mainTopUserMenu').mouseleave()
	}
	$scope.userMenu.logout = function() {
		swal({
			title: document.l10n.getEntitySync('logoutConfirm').value,
			text: document.l10n.getEntitySync('logoutConfirmText').value,
			type: 'warning',
			showCancelButton: true,
			allowOutsideClick: true,
			confirmButtonText: document.l10n.getEntitySync('logout').value
		}, function() { window.close() })
	}
})