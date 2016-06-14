Peerio.UI.controller('newGhost', function ($scope) {
    'use strict';

    var g = $scope.newGhost = {
        recipient: '',
        selectedFiles: [],
        sending: false
    };

    g.selectedLocale = null;
    g.languages = Peerio.PhraseGenerator.languages;
    $scope.$on('newMessageReset', function () {
        if (g.sending) return;
        g.recipient = '';
        g.subject = '';
        g.body = '';
        g.uploadState = null;
        g.selectedFiles = [];
        if (g.selectedLocale == null) {
            g.selectedLocale = Peerio.user.settings && Peerio.user.settings.localeCode || 'en';
            if (Peerio.PhraseGenerator.languages.findIndex(i=>i.value === g.selectedLocale) < 0) {
                g.selectedLocale = 'en';
            }
        }
        g.refreshPassphrase();
    });

    $scope.$on('newGhostAttachFileIDs', function (event, ids) {
        g.attachFileIDs = ids;
        $('div.attachFile').removeClass('visible');
        $('div.newGhost').addClass('visible');
    });

    g.attachFile = function () {
        $('input.fileSelectDialogGhost').click();
    };

    g.refreshPassphrase = function () {
        Peerio.PhraseGenerator.getPassPhrase(g.selectedLocale, 5, function (p) {
            g.passphrase = p;
            $scope.$apply();
        });
    };

    $('input.fileSelectDialogGhost').unbind().on('change', function (event) {
        event.preventDefault();
        g.selectedFiles = this.files;
        $scope.$apply();
        return false
    });

    function showUploadErr() {
        swal({
            title: document.l10n.getEntitySync('fileUploadError').value,
            text: document.l10n.getEntitySync('fileUploadErrorText').value,
            type: 'error',
            confirmButtonText: document.l10n.getEntitySync('OK').value
        })
    }

    function uploadFiles(ghostRecipientKey) {
        return new Promise(function (resolve, reject) {
            if (!g.selectedFiles.length) {
                resolve([]);
                return;
            }
            // validating individual file sizes
            for (var i = 0; i < g.selectedFiles.length; i++) {
                var file = g.selectedFiles[i];
                if (file.size >= Peerio.config.fileUploadSizeLimit) {
                    swal({
                        title: document.l10n.getEntitySync('sizeError').value,
                        text: document.l10n.getEntitySync('sizeErrorText').value,
                        type: 'error',
                        confirmButtonText: document.l10n.getEntitySync('OK').value
                    }, function () {
                        reject();
                    });
                    return;
                }
            }
            g.uploadState = {};
            // uploading
            var ids = [];
            var i = 0;

            function uploadOne() {
                var file = g.selectedFiles[i];
                g.uploadState.file = file.name;
                g.uploadState.filesLeft = g.selectedFiles.length - i + 1;
                g.uploadState.progress = 0;
                $scope.$apply();

                Peerio.file.uploadGhost(file, ghostRecipientKey,
                    // on progress
                    function (data, progress) {
                        if (hasProp(data, 'error')) {
                            reject();
                            return;
                        }
                        g.uploadState.progress = progress;
                        $scope.$apply();
                    },
                    // on finish
                    function (data) {
                        if (hasProp(data, 'error')) {
                            reject();
                            return;
                        }
                        ids.push(data.id);
                        i++;
                        if (i >= g.selectedFiles.length - 1) {
                            resolve(ids);
                        } else {
                            uploadOne();
                        }
                    }
                )
            }

            uploadOne();

        });
    }

    g.send = function () {
        // validating
        // todo check email regexp
        if (!g.recipient) {
            swal({
                title: document.l10n.getEntitySync('newGhostRecipientError').value,
                text: document.l10n.getEntitySync('newGhostRecipientErrorText').value,
                type: 'error',
                confirmButtonText: document.l10n.getEntitySync('OK').value
            });
            return false;
        }

        if (!g.subject) {
            g.subject = '';
        }

        if (!g.body) {
            g.body = ''
        }
        g.sending = true;
        // generating keys
        var ghostID = Base58.encode(nacl.randomBytes(32));
        var publicKey;
        miniLock.crypto.getKeyPair(g.passphrase, ghostID, function (keyPair) {
            publicKey = miniLock.crypto.getMiniLockID(keyPair.publicKey);
            // uploading files
            uploadFiles(publicKey)
                .then(function (ids) {
                        // sending the ghost
                        return sendGhost(ghostID, publicKey, ids);
                    },
                    function () {
                        showUploadErr();
                        g.sending = false;
                        g.uploadState = null;
                        $scope.$apply();
                    })
                .then(function () {
                    g.sending = false;
                    g.uploadState = null;
                    $scope.$root.$broadcast('frontModalsClose', null);
                    $scope.$root.$broadcast('newMessageReset', null);
                    $scope.$apply();
                }, function () {
                    swal({
                        title: document.l10n.getEntitySync('newGhostSendError').value,
                        text: document.l10n.getEntitySync('newGhostSendErrorText').value,
                        type: 'error',
                        confirmButtonText: document.l10n.getEntitySync('OK').value
                    });
                    g.sending = false;
                    g.uploadState = null;
                    $scope.$apply();
                });
        });
    };

    function sendGhost(id, pk, ids) {
        return new Promise(function (resolve, reject) {
            var names = [];
            for (var i = 0; i < g.selectedFiles.length; i++)
                names.push(g.selectedFiles[i].name);

            var ghostMsg = {
                recipient: g.recipient,
                subject: g.subject,
                message: g.body,
                files: names,
                timestamp: Date.now(),
                passphrase: g.passphrase
            };

            Peerio.crypto.encryptMessage(ghostMsg, pk,
                function (header, body) {
                    if (!header || !body) {
                        reject();
                        return;
                    }
                    var ghost = {
                        ghostID: id,
                        publicKey: pk,
                        //lifeSpanInSeconds: 60*60*24,
                        recipients: [g.recipient],
                        version: '1.0.0',
                        files: ids,
                        header: header,
                        body: body
                    };
                    Peerio.network.sendGhost(ghost, function (res) {
                        if (res && res.error) {
                            reject(res);
                        } else resolve();
                    });
                });

        });
    }
});