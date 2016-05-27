Peerio.UI.controller('loginForm', function($scope) {
	'use strict';
	$scope.login = {}
	$scope.login.version = Peerio.config.version
	$scope.login.showLoading = false
	$scope.login.login = function() {
		Peerio.storage.init($scope.login.username)
		$scope.login.username = $scope.login.username.toLowerCase()
		$scope.$root.$broadcast('login', {
			username: $scope.login.username,
			passOrPIN: $scope.login.passphrase,
			skipPIN: false
		})
	}
	$scope.$on('login', function(event, args) {
		$scope.login.showLoading = true
		//$scope.$apply()
		Peerio.user.login(args.username, args.passOrPIN, args.skipPIN, function() {
			if (Peerio.user.authTokens.length) {
				Peerio.network.getSettings(function(data) {
					$scope.login.username = ''
					$scope.login.passphrase = ''
					Peerio.user.firstName = data.firstName
					Peerio.user.lastName  = data.lastName
					Peerio.user.addresses = data.addresses
					var currLocale = Peerio.user.settings.localeCode;
					Peerio.user.settings = data.settings
					if(currLocale!== Peerio.user.settings.localeCode) {
						Peerio.user.settings.localeCode = currLocale;
						Peerio.network.updateSettings({localeCode:currLocale}, function () {});
					}
					Peerio.user.quota = data.quota;
					Peerio.user.subscriptions = data.subscriptions;
					$scope.$root.$broadcast('mainTopPopulate', null)
					$scope.$root.$broadcast('preferencesOnLogin', null)
					$scope.$root.$broadcast('contactsSectionPopulate', function() {
						$scope.$root.$broadcast('accountSettingsPopulate', null)
						$scope.$root.$broadcast('messagesSectionPopulate', function() {
							$('div.mainTopSectionTab[data-sectionLink=messages]').trigger('mousedown')
						})
						$scope.$root.$broadcast('filesSectionPopulate', null)
						$('div.loginScreen').addClass('slideUp')
						$('div.mainScreen').show()
						Peerio.UI.userMenuPopulate()
					})
				})
			}
			else {
				$scope.login.showLoading = false
				$scope.$apply()
				swal({
					title: document.l10n.getEntitySync('loginFailed').value,
					text: document.l10n.getEntitySync('loginFailedText').value,
					type: 'error',
					confirmButtonText: document.l10n.getEntitySync('OK').value
				}, function() {
					$('div.loginForm form').find('input').first().select()
					$('div.loginForm form').find('input').removeAttr('disabled')
				})
			}
		})
	});

	$scope.login.showSignupForm = function() {
		swal({
			title: document.l10n.getEntitySync('TOStitle').value,
			text: document.l10n.getEntitySync('TOStext').value + '<br><a target="_blank" href="https://github.com/PeerioTechnologies/peerio-documentation/blob/master/Terms_of_Use.md">Peerio TOS</a>',
			type: 'warning',
			showCancelButton: true,
			cancelButtonText: document.l10n.getEntitySync('decline').value,
			confirmButtonColor: '#A5E593',
			confirmButtonText: document.l10n.getEntitySync('accept').value,
			allowEscapeKey: false
		}, function (isConfirm) {
			if(isConfirm){
				$scope.login.username   = ''
				$scope.login.passphrase = ''
				$('div.signupSplash').addClass('pullUp')
				setTimeout(function() {
					$('div.signupSplash').addClass('hidden')
					$('div.signupFields').addClass('visible')
				}, 400)
				setTimeout(function() {
					$('div.signupFields').find('input')[0].focus()
				}, 700)
			} else {
				$('div.signupSplash').removeClass('pullUp');
				$('div.signupSplash').removeClass('hidden');
				$('div.signupFields').removeClass('visible');
			}
		});
	};

	$scope.login.showPassphrase = function() {
		if ($('div.loginForm form [data-ng-model="login.passphrase"]').attr('type') === 'text') {
			$('div.loginForm form [data-ng-model="login.passphrase"]').attr('type', 'password')
			$('span.loginShowPassphraseEnable').show()
			$('span.loginShowPassphraseDisable').hide()
		}
		else {
			$('div.loginForm form [data-ng-model="login.passphrase"]').attr('type', 'text')
			$('span.loginShowPassphraseEnable').hide()
			$('span.loginShowPassphraseDisable').show()
		}
	}
	$scope.selectedLocale = Peerio.UI.localeCode;
	$scope.languageOptions = Peerio.UI.languageOptions;
	$scope.changeLocale = function(){
		var defaultPouch = new PouchDB('_default')
		defaultPouch.get('localeCode', function(err, data) {
			defaultPouch.remove(data, function() {
				defaultPouch.put({
					_id: 'localeCode',
					localeCode: $scope.selectedLocale
				}, function() {
					swal({
						title: document.l10n.getEntitySync('confirmed').value,
						text: document.l10n.getEntitySync('confirmedLanguageText').value,
						type: 'success',
						confirmButtonText: document.l10n.getEntitySync('OK').value
					}, function () {
						if(chrome){
							chrome.runtime.reload();
						} else document.location.reload(true);
					});
				});
			})
		});
	}
	document.l10n.ready(function () {
		if($scope.selectedLocale) return;
		$scope.selectedLocale = Peerio.UI.localeCode;
		$scope.$apply();
	})
});
