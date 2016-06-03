Peerio.UI.controller('filesSection', function ($scope, $element, $sce) {
    'use strict';
    $scope.filesSidebar = {}
    $scope.filesSidebar.selectFile = function () {
        if (!/Sidebar/.test($element[0].className)) {
            return false
        }
        $('input.fileSelectDialog').click()
    }
    $scope.filesSidebar.getUserQuota = function () {
        return Peerio.file.getReadableFileSize(Peerio.user.quota.user)
    }
    $scope.filesSidebar.getTotalQuota = function () {
        return Peerio.file.getReadableFileSize(Peerio.user.quota.total)
    }
    $scope.filesSidebar.getQuotaPercentage = function () {
        var p = (Peerio.user.quota.user * 100) / Peerio.user.quota.total
        return Math.ceil(p) + '%'
    }
    $scope.filesSection = {}
    $scope.filesSection.searchFilter = ''
    $scope.filesSection.typeFilter = 'unsorted'
    $scope.filesSection.ownerFilter = /./
    $scope.filesSection.checkedIDs = []

    if (!$scope.$root.fileFolders) {
        var f = $scope.$root.fileFolders = {};
        f.folders = [];

        f.loadFolders = function () {
            Peerio.network.getFileFolders(function (data) {
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                Peerio.crypto.decryptFolders(data.folders, function (preFolders) {
                    var notes = [], todos = [], passwords = [];
                    f.folders = [];
                    preFolders.forEach(function (folder) {
                        if (folder.name.startsWith(Peerio.objSignature)) {
                            folder.name = folder.name.substr(Peerio.objSignature.length);
                            try {
                                var obj = JSON.parse(folder.name);
                                if (obj.isNote) {
                                    obj.id = folder.id;
                                    notes.push(obj);
                                    return;
                                }
                                if (obj.isTODO) {
                                    obj.id = folder.id;
                                    todos.push(obj);
                                    return;
                                }
                                if (obj.isPassword) {
                                    obj.id = folder.id;
                                    passwords.push(obj);
                                    return;
                                }
                            }
                            catch (err) {
                                console.log(err);
                            }
                            return;
                        }

                        f.folders.push(folder);
                    });

                    if (notes.length) {
                        Peerio.Notes.addOrUpdateBulk(notes);
                    }
                    if (todos.length) {
                        Peerio.TODOs.addOrUpdateBulk(todos);
                    }
                    if (passwords.length) {
                        Peerio.Passwords.addOrUpdateBulk(passwords);
                    }

                    f.foldersMap = {};
                    f.folders.forEach(function (folder) {
                        f.foldersMap[folder.id] = folder;
                    });
                    f.reSort();
                });
            });
        };

        f.reSort = function () {
            $scope.$root.$apply(function () {
                f.folders.sort(function (a, b) {
                    if (a.name > b.name) {
                        return 1;
                    }
                    if (a.name < b.name) {
                        return -1;
                    }
                    return 0;
                });
            });
        };

        f.addFolder = function () {
            swal({
                title: l('newFolderDialogTitle'),
                text: l('newFolderDialogText'),
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: l('folderInputPlaceholder')
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError(l("folderInputEmptyError"));
                    return false
                }
                if (f.folders.filter(function (val) {
                        return val === inputValue
                    }).length > 0) {
                    swal.showInputError(l("folderExistsError"));
                    return false
                }
                Peerio.crypto.encryptUserString(inputValue, function (encryptedName) {
                    Peerio.network.createFileFolder(encryptedName, function (response) {
                        if (response.error) {
                            console.log(response);
                            swal(l("error"), l('creatingFolderError'), "error");
                        } else {
                            var folder = {id: response.id, items: [], name: inputValue};
                            f.folders.push(folder);
                            f.foldersMap[folder.id] = folder;
                            f.reSort();
                            swal({title: l('success'), text: l('folderCreated'), type: "success"});
                        }
                    })
                });
            });
        };

        f.renameFolder = function (folder) {
            swal({
                title: l("renameFolderDialogTitle"),
                text: l('renameFolderDialogText'),
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: l('folderInputPlaceholder'),
                inputValue: folder.name
            }, function (inputValue) {
                if (inputValue === false) return false;
                if (inputValue === "") {
                    swal.showInputError(l("folderInputEmptyError"));
                    return false
                }
                if (f.folders.filter(function (val) {
                        return val === inputValue
                    }).length > 0) {
                    swal.showInputError(l("folderExistsError"));
                    return false
                }
                Peerio.crypto.encryptUserString(inputValue, function (encryptedName) {
                    Peerio.network.renameFileFolder(folder.id, encryptedName, function (response) {
                        if (response.error) {
                            console.log(response);
                            swal(l('error'), l('renamingFolderError'), "error");
                        } else {
                            f.foldersMap[folder.id] = inputValue;
                            f.reSort();
                            swal({title: l('success'), text: l('folderRenamed'), type: "success"});
                        }
                    });
                });
            });
        };

        f.removeFolder = function (folder) {
            swal({
                title: l('removeFolderDialogTitle'),
                text: l("removeFolderDialogText1") + " '" + folder.name + "'. " + l('removeFileFolderDialogText2'),
                type: "warning",
                confirmButtonColor: "#DD6B55",
                showCancelButton: true,
                closeOnConfirm: true,
                animation: "slide-from-top"
            }, function (isConfirm) {
                if (!isConfirm) return;
                Peerio.network.removeFileFolder(folder.id, function (response) {
                    if (response.error) {
                        console.log(response);
                        swal(l('error'), l('removingFolderError'), "error");
                    } else {
                        var ind = f.folders.findIndex(function (item) {
                            return item.id === folder.id
                        });
                        if (ind >= 0) {
                            f.folders.splice(ind, 1);
                        }
                        delete f.foldersMap[folder.id];
                        Object.keys(Peerio.user.files).forEach(function (id) {
                            if (Peerio.user.files.hasOwnProperty(id)) {
                                var file = Peerio.user.files[id];
                                if (file.folderID === folder.id)
                                    file.folderID = null;
                            }
                        });
                        swal({title: l('success'), text: l('folderRemoved'), type: "success"});
                    }
                })
            });
        };

        f.addToFolder = function (file) {
            var previous = file.folderID;
            window.setTimeout(function () {
                Peerio.network.moveFileIntoFolder(file.id, file.folderID, function (response) {
                    if (response.error) {
                        swal(l('error'), l('fileMoveError'), "error");
                        file.folderID = previous;
                        return;
                    }
                    $scope.$apply();
                });
            }, 500);
        };

        f.addToFolderBulk = function (ids) {
            if (ids.length === 0) {
                swal(l('moveFilesDialogTitle'), l('filesNotSelectedError'), "info");
                return;
            }
            var html = "<strong>" + ids.length + "</strong> " + l('moveFilesDialogText') + "<br/>"
                + "<select id='groupFolderSelect'><option value='' selected>" + l('inbox') + "</option>";

            f.folders.forEach(function (folder) {
                html += "<option value='" + folder.id + "'>" + folder.name + "</option>";
            });
            html += "</select>";
            swal({
                title: l('moveFilesDialogTitle'),
                text: html,
                type: "warning",
                showCancelButton: true,
                closeOnConfirm: false,
                html: true,
                animation: "slide-from-top"
            }, function (isConfirm) {
                if (!isConfirm) return;
                var folderId = $('#groupFolderSelect').val();
                if (folderId == '') folderId = null;
                Peerio.network.moveFileIntoFolder(ids, folderId, function (response) {
                    if (response.error) {
                        console.log(response);
                        swal(l('error'), l('movingFilesError'), "error");
                    } else {
                        ids.forEach(function (id) {
                            Peerio.user.files[id].folderID = folderId;
                        });
                        $scope.$root.$broadcast('filesSectionClearSelection');
                        $scope.$root.$apply();
                        swal({title: l('success'), text: ids.length + " " + l('filesMoved'), type: "success"});
                    }
                })
            });
        };

        f.handleDragStart = function (file) {
            f.dragging = file;
        };

        f.handleDragEnd = function (file) {
            f.dragging = null;
            // console.log('dragend');
        };

        f.handleDragEnter = function (folder) {
            //console.log('dragenter', folder);
        };
        f.handleDragLeave = function (folder) {
            //console.log('dragleave', folder);
        };

        f.handleDrop = function (folder) {
            if (!folder) folder = {id: null, name: l('inbox')};
            // console.log('drop', folder);
            if (!f.dragging) return;
            var file = f.dragging;
            Peerio.network.moveFileIntoFolder(file.id, folder.id, function (response) {
                if (response.error) {
                    swal(l('error'), l('movingFilesError'), "error");
                    return;
                }
                file.folderID = folder.id;
                $scope.$root.$apply();
                $scope.$apply();
            });
        };
        f.getFolderName = function (id) {
            if (f.foldersMap && f.foldersMap[id])
                return f.foldersMap[id].name;

            return '[none]';
        };
    }
    Peerio.UI.filesSectionScopeApply = function () {
        $scope.$apply()
    }
    Peerio.UI.filesSectionPopulate = function () {
        $scope.$root.$broadcast('filesSectionPopulate', null)
    }
    var foldersLoaded = false
    $scope.$on('filesSectionPopulate', function (event, callback) {
        if (/Sidebar/.test($element[0].className)) {
            return false
        }
        if(!foldersLoaded){
            $scope.$root.fileFolders.loadFolders();
            foldersLoaded = true;
        }
        Peerio.file.getFiles(function () {
            $scope.filesSection.files = Peerio.user.files
            $scope.$apply()
            if (typeof(callback) === 'function') {
                callback()
            }
        })
    })

    $scope.$root.$on('filesSectionClearSelection', function () {
        $scope.filesSection.checkedIDs = [];
        $('.filesSectionTableCheckboxCell .blueCheckbox:checked').prop('checked', false);
    });

    $scope.$on('filesSectionSetSearchFilter', function (event, input) {
        if ($scope.filesSection.searchFilter === '' && input !== '') {
            $scope.filesSection.setTypeFilter('', {target: $('#allFilesFolder')});
        }
        $scope.filesSection.searchFilter = input.toLowerCase()
        $scope.$apply()
    })
    $scope.$on('filesSectionSetTypeFilter', function (event, type) {
        $scope.filesSection.typeFilter = type
    })
    $scope.$on('filesSectionSetOwnerFilter', function (event, owner) {
        $scope.filesSection.ownerFilter = owner
    })
    $scope.filesSection.getDate = function (timestamp) {
        if (typeof(timestamp) === 'undefined') {
            return ''
        }
        return Peerio.util.getDateFromTimestamp(timestamp)
    }
    $scope.filesSection.getSize = function (bytes) {
        return Peerio.file.getReadableFileSize(bytes)
    }
    $scope.filesSection.truncateName = function (fileName) {
        return Peerio.file.truncateFileName(fileName)
    }
    $scope.filesSection.getIcon = function (fileID) {
        if (hasProp(Peerio.user.files, fileID)) {
            return $sce.trustAsHtml(
                Peerio.user.files[fileID].icon
            )
        }
    }
    $scope.filesSection.onCheck = function (id, event) {
        if (/Sidebar/.test($element[0].className)) {
            return false
        }
        if (event.target.checked) {
            var index = $scope.filesSection.checkedIDs.indexOf(id)
            if (index < 0) {
                $scope.filesSection.checkedIDs.push(id)
            }
        }
        else {
            var index = $scope.filesSection.checkedIDs.indexOf(id)
            if (index >= 0) {
                $scope.filesSection.checkedIDs.splice(index, 1)
            }
        }
    }
    $scope.filesSection.getFullName = function (username) {
        return Peerio.util.getFullName(username)
    }
    $scope.filesSection.setTypeFilter = function (type, event) {
        $('ul.filesSidebarTypeFilters li').removeClass('active')
        $('.filesSidebar ul.folderView li').removeClass('active')
        $(event.target).addClass('active')
        $scope.$root.$broadcast('filesSectionSetTypeFilter', type)
    }
    $scope.filesSection.checkTypeFilter = function (file) {
        var type = file.type;
        // all
        if ($scope.filesSection.typeFilter === '') {
            return true
        }
        // usorted
        if ($scope.filesSection.typeFilter === 'unsorted' && !file.folderID) {
            return true
        }

        // file type
        if ($scope.filesSection.typeFilter === 'other') {
            return !(new RegExp('^((image)|(video)|(pdf)|(word)|(excel)|(powerpoint))$')).test(type)
        }
        var typeTest = (new RegExp('^' + $scope.filesSection.typeFilter + '$')).test(type);
        if (typeTest) return true;

        // folder
        return $scope.filesSection.typeFilter === file.folderID;

    }
    $scope.filesSection.checkSearchFilter = function (file) {
        if (!$scope.filesSection.searchFilter.length) {
            return true
        }
        if (file.name.toLowerCase().match($scope.filesSection.searchFilter)) {
            return true
        }
        if (file.creator.toLowerCase().match($scope.filesSection.searchFilter)) {
            return true
        }
        var fullName = Peerio.util.getFullName(file.creator).toLowerCase()
        if (fullName.match($scope.filesSection.searchFilter)) {
            return true
        }
        return false
    }
    $scope.filesSection.setOwnerFilter = function (owner, event) {
        if (owner === 'all') {
            owner = new RegExp('.')
        }
        if (owner === 'me') {
            owner = new RegExp('^' + Peerio.user.username + '$')
        }
        if (owner === 'others') {
            owner = new RegExp('^(?!(' + Peerio.user.username + ')$).*')
        }
        $('div.filesSectionToolbarSort button').removeClass('active')
        $(event.target).addClass('active')
        $scope.$root.$broadcast('filesSectionSetOwnerFilter', owner)
    }
    $scope.filesSection.checkOwnerFilter = function (file) {
        return $scope.filesSection.ownerFilter.test(file.creator)
    }
    $scope.filesSection.downloadFile = function (id) {
        Peerio.UI.downloadFile.downloadFile(id)
        setTimeout(function () {
            $scope.filesSection.hideListingActions('')
        }, 100)
    }
    $scope.filesSection.sendFiles = function (ids) {
        $scope.$root.$broadcast(
            'attachFilePopulate', {
                recipients: [],
                opener: 'newMessage'
            }
        )
        ids.forEach(function (id) {
            var size = Peerio.user.files[id].size
            var timestamp = Peerio.user.files[id].timestamp
            $('#attachFileCheckbox' + size + timestamp).prop('checked', true)
        })
        $scope.$root.$broadcast('newMessageAttachFileIDs', ids)
        $('div.frontModalsWrapper').addClass('visible')
        $('div.newMessage').addClass('visible')
        setTimeout(function () {
            $('input.newMessageTo')[0].focus()
            $scope.filesSection.hideListingActions('')
        }, 100)
    }
    $scope.filesSection.removeFiles = function (ids) {
        if (/Sidebar/.test($element[0].className)) {
            return false
        }
        swal({
            title: document.l10n.getEntitySync('removeFilesQuestion').value,
            text: document.l10n.getEntitySync('removeFilesText').value,
            type: 'warning',
            showCancelButton: true,
            cancelButtonText: document.l10n.getEntitySync('cancel').value,
            confirmButtonColor: '#e07a66',
            confirmButtonText: document.l10n.getEntitySync('remove').value,
            closeOnConfirm: true
        }, function () {
            Peerio.file.removeFile(ids, function () {
                $scope.filesSection.checkedIDs = []
                Peerio.network.getSettings(function (data) {
                    Peerio.user.quota = data.quota;
                    Peerio.user.subscriptions = data.subscriptions;
                    $scope.$apply()
                })
            })
            $scope.filesSection.hideListingActions('')
        })
    }
    $scope.filesSection.nukeFiles = function (ids) {
        if (/Sidebar/.test($element[0].className)) {
            return false
        }
        var ownAllFiles = true
        ids.forEach(function (id) {
            if (Peerio.user.files[id].creator !== Peerio.user.username) {
                ownAllFiles = false
            }
        })
        if (!ownAllFiles) {
            swal({
                title: document.l10n.getEntitySync('destroyFilesOwnerError').value,
                text: document.l10n.getEntitySync('destroyFilesOwnerErrorText').value,
                type: 'error',
                confirmButtonText: document.l10n.getEntitySync('OK').value
            })
            return false
        }
        swal({
            title: document.l10n.getEntitySync('destroyFilesQuestion').value,
            text: document.l10n.getEntitySync('destroyFilesText').value,
            type: 'warning',
            showCancelButton: true,
            cancelButtonText: document.l10n.getEntitySync('cancel').value,
            confirmButtonColor: '#e07a66',
            confirmButtonText: document.l10n.getEntitySync('destroy').value,
            closeOnConfirm: true
        }, function () {
            Peerio.file.nukeFile(ids, function () {
                $scope.filesSection.checkedIDs = []
                Peerio.network.getSettings(function (data) {
                    Peerio.user.quota = data.quota;
                    Peerio.user.subscriptions = data.subscriptions;
                    $scope.$apply()
                })
            })
            $scope.filesSection.hideListingActions('')
        })
    }
    $scope.filesSection.showListingActions = function (id, event) {
        if (Peerio.user.files[id].uploading) {
            return false
        }
        $scope.filesSection.selectedFile = id
        $('div.fileListingActions').css({
            left: event.clientX + 5,
            top: event.clientY + 5
        }).addClass('expand')
    }
    $scope.filesSection.isFileIDOwnedByMe = function (id) {
        if (!id) {
            return false
        }
        if (Peerio.user.files[id].creator === Peerio.user.username) {
            return true
        }
        return false
    }
    $scope.filesSection.hideListingActions = function (event) {
        if (
            (event === '') ||
            (!event.srcElement.className.match('fileListing'))
        ) {
            delete $scope.filesSection.selectedFile
            $('div.fileListingActions').removeClass('expand')
        }
    }

    $scope.filesSection.fileObjectHandler = function (file) {
        return new Promise(function (resolve, reject) {
            if (file.size >= Peerio.config.fileUploadSizeLimit) {
                swal({
                    title: document.l10n.getEntitySync('sizeError').value,
                    text: document.l10n.getEntitySync('sizeErrorText').value,
                    type: 'error',
                    confirmButtonText: document.l10n.getEntitySync('OK').value
                }, function () {
                    resolve();
                });
            }
            else if (file.size >= (Peerio.user.quota.total - Peerio.user.quota.user)) {
                swal({
                    title: document.l10n.getEntitySync('quotaError').value,
                    text: document.l10n.getEntitySync('quotaErrorText').value,
                    type: 'error',
                    confirmButtonText: document.l10n.getEntitySync('OK').value
                }, function () {
                    reject();
                });
            }
            else {
                Peerio.file.upload(file, [Peerio.user.username],
                    function (data, id) {
                        if (hasProp(data, 'error')) {
                            swal({
                                title: document.l10n.getEntitySync('fileUploadError').value,
                                text: document.l10n.getEntitySync('fileUploadErrorText').value,
                                type: 'error',
                                confirmButtonText: document.l10n.getEntitySync('OK').value
                            }, function () {
                                delete Peerio.user.files[id];
                                resolve();
                            });
                        }
                        $scope.$apply();
                    },
                    function (data, id) {
                        if (hasProp(data, 'error')) {
                            swal({
                                title: document.l10n.getEntitySync('fileUploadError').value,
                                text: document.l10n.getEntitySync('fileUploadErrorText').value,
                                type: 'error',
                                confirmButtonText: document.l10n.getEntitySync('OK').value
                            }, function () {
                                delete Peerio.user.files[id];
                                resolve();
                            });
                        }
                        $scope.$apply();
                    },
                    function (data, id) {
                        if (hasProp(data, 'error')) {
                            swal({
                                title: document.l10n.getEntitySync('fileUploadError').value,
                                text: document.l10n.getEntitySync('fileUploadErrorText').value,
                                type: 'error',
                                confirmButtonText: document.l10n.getEntitySync('OK').value
                            }, function () {
                                delete Peerio.user.files[id];
                                resolve();
                            });
                            return;
                        }
                        Peerio.network.getSettings(function (data) {
                            Peerio.user.quota = data.quota;
                            Peerio.user.subscriptions = data.subscriptions;
                            if (Peerio.file.autoCheck) {
                                // @todo kaepora
                                Peerio.file.autoCheck = false
                            }
                            $scope.$apply();
                            resolve();
                        })
                    }
                )
            }
        });
    };

    function uploadQueue(files) {
        if (!files || files.length === 0) {
            return false;
        }
        var i = 0;
        console.log('FILES: uploading '+ files.length+" files");
        function uploadOne() {
            console.log('FILES: uploading file: '+i);
            $scope.filesSection.fileObjectHandler(files[i])
                .then(function () {
                    console.log("FILES: success uploading "+ i);
                    if (++i < files.length) window.setTimeout(uploadOne, 300);
                    else  $('form.fileUploadForm input[type=reset]').click();
                }, function (err) {
                    console.log("FILES: filed uploading. stopping. " +err);
                    $('form.fileUploadForm input[type=reset]').click();
                });
        }
        uploadOne();
    }

    $('input.fileSelectDialog').unbind().on('change', function (event) {
        event.preventDefault();
        uploadQueue(this.files);
        return false
    });
    var dragCounter = 0
    $(document).unbind()
    function isFileDrag(e) {
        return e && e.dataTransfer && e.dataTransfer.types.length > 0 && e.dataTransfer.types[0] === "Files";
    }

    $(document).on('dragover', function (e) {
        e.preventDefault()
        return false
    })
    $(document).on('dragenter', function (e) {
        if (!isFileDrag(e)) return;
        e.preventDefault()
        if (!Peerio.user.username) {
            return false
        }
        dragCounter++
        $('div.dragAndDropUpload').addClass('visible')
        return false
    })
    $(document).on('dragleave', function (e) {
        if (!isFileDrag(e)) return;
        if (!Peerio.user.username) {
            return false
        }
        dragCounter--
        if (!dragCounter) {
            dragCounter = 0
            $('div.dragAndDropUpload').removeClass('visible')
        }
        return false
    })
    $(document).on('drop', function (e) {
        if (!isFileDrag(e)) return;
        e.preventDefault()
        if (!Peerio.user.username) {
            return false
        }
        dragCounter = 0
        $('div.dragAndDropUpload').removeClass('visible')
        if ($('div.attachFile.visible').length) {
            Peerio.file.autoCheck = true
        }
        else {
            $('div.mainTopSectionSelect [data-sectionLink=files]').trigger('mousedown')
        }
       // for (var i = 0; i < e.dataTransfer.files.length; i++) {
        //    $scope.filesSection.fileObjectHandler(e.dataTransfer.files[i])
       // }
        uploadQueue(e.dataTransfer.files);
        return false
    })
})