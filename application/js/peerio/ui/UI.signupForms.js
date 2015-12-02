Peerio.UI.controller('signupForms', function ($scope) {
  'use strict';
  $scope.signup = {}
  $scope.signup.selectedLocale = Peerio.user.settings.localeCode;
  window.setTimeout(function(){
    $scope.signup.selectedLocale = Peerio.user.settings.localeCode;
    $scope.$apply();
  }, 3000);

  $scope.signup.languageOptions = Peerio.PhraseGenerator.languages;
  $scope.signup.wordCount = 5;
  $scope.signup.wordCountOptions = [
    {name: '5', value: 5},
    {name: '6', value: 6},
    {name: '7', value: 7},
    {name: '8', value: 8},
    {name: '9', value: 9},
    {name: '10', value: 10}];

  $scope.signup.checkUsername = function () {
    if (
      (typeof($scope.signup.username) !== 'string') || !$scope.signup.username.length
    ) {
      return false
    }
    $scope.signup.username = $scope.signup.username.toLowerCase()
    Peerio.network.validateUsername(
      $scope.signup.username,
      function (data) {
        if (hasProp(data, 'error')) {
          $('div.signupUsernameAvailability').addClass('visible')
          $('input.signupDesiredUsername').addClass('invalid')
        }
        else {
          $('div.signupUsernameAvailability').removeClass('visible')
          $('input.signupDesiredUsername').removeClass('invalid')
        }
      }
    )
  }
  $scope.signup.checkAddress = function () {
    Peerio.network.validateAddress(
      $scope.signup.emailOrPhone,
      function (data) {
        if (hasProp(data, 'error')) {
          $('div.signupAddressAvailability').addClass('visible')
          $('input.signupEmailOrPhone').addClass('invalid')
        }
        else {
          $('div.signupAddressAvailability').removeClass('visible')
          $('input.signupEmailOrPhone').removeClass('invalid')
        }
      }
    )
  }
  $scope.signup.generatedPassphraseRefresh = function () {
    Peerio.PhraseGenerator.getPassPhrase($scope.signup.selectedLocale, $scope.signup.wordCount, function (phrase) {
      $scope.signup.passphrase = phrase;
      $scope.$apply();
    });
  };
  $scope.signup.basicInformationContinue = function () {
    if ($('input.invalid').length) { return false }
    $('div.signupProgressBarFill').css({width: 100})
    $('form.signupBasicInformation').hide()
    $('form.signupYourPassphrase').show()
    //$('form.signupYourPassphrase').find('input')[0].focus()
    Peerio.UI.applyDynamicElements()
    $scope.signup.generatedPassphraseRefresh()
    if (typeof(require) === 'function') {
      $('a').unbind().on('click', function (e) {
        e.preventDefault()
        var gui = require('nw.gui')
        gui.Shell.openExternal($(this).attr('href'))
      })
    }
  }
  $scope.signup.checkPassphrase = function () {
    $scope.signup.username = $scope.signup.username.toLowerCase()

    $('.signupGeneratedPassphrase').addClass('blurred');
    swal({
      title: document.l10n.getEntitySync('signupPassphraseConfirm').value,
      text: document.l10n.getEntitySync('signupPassphraseConfirmText').value,
      type: 'input',
      showCancelButton: true,
      cancelButtonText: document.l10n.getEntitySync('cancel').value,
      confirmButtonText: document.l10n.getEntitySync('continue').value,
      closeOnConfirm: false,
      inputType: 'text'
    }, function (input) {
      $('.signupGeneratedPassphrase').removeClass('blurred');
      if(input !== $scope.signup.passphrase)  {
        swal('error',document.l10n.getEntitySync('passphraseConfirmFailed').value, 'error');
        return false;
      }
      $('button.yourPassphraseContinue').attr('disabled', true)
      Peerio.user.setKeyPair(
        $scope.signup.passphrase,
        $scope.signup.username,
        function () {
          $scope.signup.registerAccount()
        }
      )
      swal.close();
    });
   // window.setTimeout(function(){
   //   $('.sweet-alert.show-input input').bind('paste', function(e){e.preventDefault();});
   // }, 300);

  }

  $scope.signup.registerAccount = function () {
    $scope.signup.address = Peerio.util.parseAddress($scope.signup.emailOrPhone)
    $scope.signup.username = $scope.signup.username.toLowerCase()
    $scope.$apply()
    Peerio.user.registerAccount($scope.signup.username, {
      firstName: $scope.signup.firstName,
      lastName: $scope.signup.lastName,
      address: $scope.signup.address,
      miniLockID: Peerio.user.miniLockID,
      localeCode: Peerio.UI.localeCode
    }, function (data) {
      if (hasProp(data, 'error')) {
        swal({
          title: document.l10n.getEntitySync('registerAccountError').value,
          text: document.l10n.getEntitySync('registerAccountErrorText').value,
          type: 'error',
          confirmButtonText: document.l10n.getEntitySync('OK').value
        })
      }
      $scope.signup.yourPassphraseContinue()
    }, function () {
      swal({
        title: document.l10n.getEntitySync('registerAccountError').value,
        text: document.l10n.getEntitySync('registerAccountErrorText').value,
        type: 'error',
        confirmButtonText: document.l10n.getEntitySync('OK').value
      })
    })
  }
  $scope.signup.yourPassphraseContinue = function () {
    $('div.signupProgressBarFill').css({width: 200})
    $('form.signupYourPassphrase').hide()
    $scope.signup.accountConfirmationContinue();
    return;
    $('form.signupAccountConfirmation').show()
    $('form.signupAccountConfirmation').find('input')[0].focus()
    $scope.signup.confirmationCodeCountdown = 600
    $scope.signup.confirmationCodeInterval = setInterval(function () {
      $scope.signup.confirmationCodeCountdown = parseInt(
          $scope.signup.confirmationCodeCountdown
        ) - 1
      if ($scope.signup.confirmationCodeCountdown < 1) {
        clearInterval($scope.signup.confirmationCodeInterval)
        swal({
          title: document.l10n.getEntitySync('signupConfirmationCodeExpired').value,
          text: document.l10n.getEntitySync('signupConfirmationCodeExpiredText').value,
          type: 'error',
          confirmButtonText: document.l10n.getEntitySync('OK').value,
        }, function () {
          window.close()
        })
      }
      $scope.$apply()
    }, 1000)
    Peerio.UI.applyDynamicElements()
  }
  $scope.signup.confirmAccount = function () {
    Peerio.network.sendAccountConfirmation(
      $scope.signup.confirmationCode,
      function (data) {
        if (hasProp(data, 'error')) {
          $('div.signupConfirmationCodeValidity').addClass('visible')
          $('input.confirmationCode').addClass('invalid')
        }
        else {
          $('div.signupConfirmationCodeValidity').removeClass('visible')
          $('input.confirmationCode').removeClass('invalid')
          clearInterval($scope.signup.confirmationCodeInterval)
          $scope.signup.accountConfirmationContinue()
        }
      }
    )
  }
  $scope.signup.accountConfirmationContinue = function () {
    $('div.signupProgressBarFill').css({width: 300})
    $('form.signupAccountConfirmation').hide()
    $('form.signupFinishingUp').show()
    $('form.signupFinishingUp').find('input')[0].focus()
    Peerio.UI.applyDynamicElements()
  }
  $scope.signup.peerioPINStrength = function () {
    if (!$scope.signup.peerioPIN) { return false }
    var entropy = zxcvbn($scope.signup.peerioPIN).entropy
    if (entropy >= Peerio.config.minPINEntropy) {
      return true
    }
    return false
  }
  $scope.signup.peerioPINSet = function () {
    $('button.signupPeerioPINEntryContinue').attr('disabled', true)
    Peerio.user.setPIN(
      $scope.signup.peerioPIN,
      Peerio.user.username,
      function () {
        $scope.signup.firstLogin()
      }
    )
  }
  $scope.signup.firstLogin = function () {
    window.firstLogin = true;
    $scope.signup.username = $scope.signup.username.toLowerCase()
    $scope.$root.$broadcast('login', {
      username: $scope.signup.username,
      passOrPIN: $scope.signup.passphrase,
      skipPIN: true
    })
  }
  $scope.signup.generatedPassphraseRefresh();
})
