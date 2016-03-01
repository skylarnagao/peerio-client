Peerio.UI.controller('messagesSection', function ($scope, $element, $sce, $filter, hotkeys) {
        'use strict';

        (function () {
            if (/Sidebar/.test($element[0].className)) {
                return false
            }
            hotkeys.bindTo($scope).add({
                combo: 'command+enter',
                description: 'Send Message',
                allowIn: ['textarea'],
                callback: function () {
                    if ($scope.messagesSection.conversation) {
                        $scope.messagesSection.replyToConversation(
                            $scope.messagesSection.conversation
                        )
                    }
                }
            })
            hotkeys.bindTo($scope).add({
                combo: 'ctrl+enter',
                description: 'Send Message',
                allowIn: ['textarea'],
                callback: function () {
                    if ($scope.messagesSection.conversation) {
                        $scope.messagesSection.replyToConversation(
                            $scope.messagesSection.conversation
                        )
                    }
                }
            })
            hotkeys.bindTo($scope).add({
                combo: 'enter',
                description: 'Send Message (if quick sending is enabled)',
                allowIn: ['textarea'],
                callback: function (event) {
                    if (
                        $scope.messagesSection.pressEnterToSend &&
                        $scope.messagesSection.conversation
                    ) {
                        event.preventDefault()
                        $scope.messagesSection.replyToConversation(
                            $scope.messagesSection.conversation
                        )
                    }
                }
            })
        })()

        $scope.messagesSidebar = {}
        $scope.messagesSidebar.newMessage = function () {
            $('div.frontModalsWrapper').addClass('visible')
            $('div.newMessage').addClass('visible')
            setTimeout(function () {
                $('input.newMessageTo')[0].focus()
            }, 100)
        }
        $scope.messagesSection = {}
        $scope.messagesSection.replyBuffers = {}
        $scope.messagesSection.readOnUnfocusedBuffer = []
        $scope.messagesSection.attachFileIDs = []
        $scope.messagesSection.fetchedConversations = []
        $scope.messagesSection.searchFilter = ''
        $scope.messagesSection.typeFilter = 'inbox'
        $scope.messagesSection.checkedIDs = []
        $scope.messagesSection.checkedReceipts = {}
        $scope.messagesSection.messageNewCount = 0

        if (!$scope.$root.convFolders) {
            var f = $scope.$root.convFolders = {};
            var l = function (n) {
                return document.l10n.getEntitySync(n).value
            };
            f.folders = [];

            f.loadFolders = function () {
                Peerio.network.getConversationFolders(function (data) {
                    if (data.error) {
                        console.error(data.error);
                        return;
                    }
                    Peerio.crypto.decryptFolders(data.folders, function (folders) {
                        f.foldersMap = {};
                        folders.forEach(function (folder) {
                            f.foldersMap[folder.id] = folder;
                        });
                        $scope.$root.$apply(function () {
                            f.folders = folders.sort(function (a, b) {
                                if (a.name > b.name) {
                                    return 1;
                                }
                                if (a.name < b.name) {
                                    return -1;
                                }
                                return 0;
                            });
                        });
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
                        Peerio.network.createConversationFolder(encryptedName, function (response) {
                            if (response.error) {
                                console.log(response);
                                swal(l("error"), l('creatingFolderError'), "error");
                            } else {
                                f.loadFolders();
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
                        Peerio.network.renameConversationFolder(folder.id, encryptedName, function (response) {
                            if (response.error) {
                                console.log(response);
                                swal(l('error'), l('renamingFolderError'), "error");
                            } else {
                                f.loadFolders();
                                swal({title: l('success'), text: l('folderRenamed'), type: "success"});
                            }
                        });
                    });
                });
            };

            f.removeFolder = function (folder) {
                swal({
                    title: l('removeFolderDialogTitle'),
                    text: l("removeFolderDialogText1") + " '" + folder.name + "'. " + l('removeFolderDialogText2'),
                    type: "warning",
                    confirmButtonColor: "#DD6B55",
                    showCancelButton: true,
                    closeOnConfirm: true,
                    animation: "slide-from-top"
                }, function (isConfirm) {
                    if (!isConfirm) return;
                    Peerio.network.removeConversationFolder(folder.id, function (response) {
                        if (response.error) {
                            console.log(response);
                            swal(l('error'), l('removingFolderError'), "error");
                        } else {
                            f.loadFolders();
                            Object.keys(Peerio.user.conversations).forEach(function (id) {
                                if (Peerio.user.conversations.hasOwnProperty(id)) {
                                    var c = Peerio.user.conversations[id];
                                    if (c.folderID === folder.id) c.folderID = null;
                                }
                            });
                            swal({title: l('success'), text: l('folderRemoved'), type: "success"});
                        }
                    })
                });
            };

            f.addToFolder = function (conversation) {
                var previous = conversation.folderID;
                window.setTimeout(function () {
                    Peerio.network.moveConversationIntoFolder(conversation.id, conversation.folderID, function (response) {
                        if (response.error) {
                            swal(l('error'), l('conversationMoveError'), "error");
                            conversation.folderID = previous;
                            return;
                        }
                        $scope.$apply();
                    });
                }, 500);
            };

            f.addToFolderBulk = function (ids, conversation) {
                if (ids.length === 0 && !conversation) {
                    swal(l('moveConversationsDialogTitle'), l('conversationsNotSelectedError'), "info");
                    return;
                }
                if (!ids.length) ids = [conversation.id];

                var html = "<strong>" + ids.length + "</strong> " + l('moveConversationsDialogText') + "<br/>"
                    + "<select id='groupFolderSelect'><option value='' selected>" + l('inbox') + "</option>";

                f.folders.forEach(function (folder) {
                    html += "<option value='" + folder.id + "'>" + folder.name + "</option>";
                });
                html += "</select>";
                swal({
                    title: l('moveConversationsDialogTitle'),
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
                    Peerio.network.moveConversationIntoFolder(ids, folderId, function (response) {
                        if (response.error) {
                            console.log(response);
                            swal(l('error'), l('movingConversationsError'), "error");
                        } else {
                            ids.forEach(function (id) {
                                Peerio.user.conversations[id].folderID = folderId;
                            });
                            $scope.$root.$broadcast('messagesSectionClearSelection');
                            $scope.$root.$apply();
                            swal({title: l('success'), text: ids.length + " " + l('conversationsMoved'), type: "success"});
                        }
                    })
                });
            };

            f.handleDragStart = function (conversation) {
                f.dragging = conversation;
            };

            f.handleDragEnd = function (conversation) {
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
                var conversation = f.dragging;
                Peerio.network.moveConversationIntoFolder(conversation.id, folder.id, function (response) {
                    if (response.error) {
                        swal(l('error'), l('movingConversationsError'), "error");
                        return;
                    }
                    conversation.folderID = folder.id;
                    $scope.$apply();
                });
            };
            f.getFolderName = function (id) {
                for (var i = 0; i < f.folders.length; i++) {
                    if (f.folders[i].id === id) return f.folders[i].name;
                }
                return 'Inbox';
            };
        }
        $scope.$root.$on('messagesSectionClearSelection', function () {
            $scope.messagesSection.checkedIDs = [];
            $('div.messageListItem .blueCheckbox:checked').prop('checked', false);
        });
        $scope.$on('messagesSectionPopulate', function (event, callback) {
            $scope.$root.convFolders.loadFolders();
            $scope.messagesSection.listIsLoading = true
            if (/Sidebar/.test($element[0].className)) {
                return false
            }
            Peerio.storage.db.get('conversations', function (err, conversations) {
                Peerio.message.getAllConversations(function () {
                    $scope.messagesSection.conversations = Peerio.user.conversations
                    $scope.messagesSection.listIsLoading = false
                    $scope.$apply(Peerio.UI.applyDynamicElements)
                    $scope.$root.$broadcast('messagesSectionUpdate', null)
                    if (typeof(callback) === 'function') {
                        callback()
                    }
                })
                // @todo kaepora ^
            })
        })
        Peerio.UI.messagesSectionUpdate = function () {
            $scope.$root.$broadcast('messagesSectionUpdate', null)
        }
        $scope.$on('messagesSectionUpdate', function () {
            if (/Sidebar/.test($element[0].className)) {
                return false
            }
            Peerio.message.getModifiedMessages(function (modified) {
                var playReceived = false, playAck = false;

                modified.forEach(function (message) {

                    if (Peerio.user.settings.useSounds) {
                        if (message.sender !== Peerio.user.username) {
                            if (message.decrypted.message === ':::peerioAck:::')
                                playAck = true;
                            else
                                playReceived = true;
                        }
                    }

                    if (hasProp(Peerio.user.conversations, message.conversationID)) {
                        if (hasProp(
                                Peerio.user.conversations[message.conversationID].messages, message.id)
                        ) {
                            Peerio.user.conversations[message.conversationID].messages[message.id].recipients = message.recipients
                            $scope.$apply(Peerio.UI.applyDynamicElements)
                        }
                        else {
                            Peerio.user.conversations[message.conversationID].messages[message.id] = message
                            if (
                                (message.sender !== Peerio.user.username) &&
                                (
                                    !document.hasFocus() || !$('div.mainTopSectionTab[data-sectionlink=messages]').hasClass('active') ||
                                    (
                                        $scope.messagesSection.conversation &&
                                        $scope.messagesSection.conversation.id !== message.conversationID
                                    )
                                )
                            ) {
                                var notificationText = message.decrypted.message
                                if (notificationText === ':::peerioAck:::') {
                                    notificationText = document.l10n.getEntitySync('acknowledgedMessage').value
                                }
                                Peerio.notification.show(message.conversationID + '!' + Base58.encode(nacl.randomBytes(16)), {
                                    title: Peerio.util.getFullName(message.sender),
                                    message: notificationText,
                                    contextMessage: message.decrypted.subject
                                }, function () {
                                })
                            }
                        }
                        if (
                            (message.sender !== Peerio.user.username) &&
                            (
                                !$('div.mainTopSectionTab[data-sectionlink=messages]').hasClass('active') || !$scope.messagesSection.conversation ||
                                (
                                    $scope.messagesSection.conversation &&
                                    $scope.messagesSection.conversation.id !== message.conversationID
                                )
                            )
                        ) {
                            Peerio.user.conversations[message.conversationID].original.isModified = true
                            Peerio.user.conversations[message.conversationID].lastTimestamp = message.timestamp
                            Peerio.storage.db.get('conversations', function (err, conversations) {
                                if (hasProp(conversations, message.conversationID)) {
                                    var original = conversations[message.conversationID].original
                                    conversations[message.conversationID].messages[original].isModified = true
                                    conversations[message.conversationID].lastTimestamp = message.timestamp
                                    Peerio.storage.db.put(conversations, function () {
                                    })
                                }
                            })
                        }
                        if (
                            $scope.messagesSection.conversation &&
                            ($scope.messagesSection.conversation.id === message.conversationID)
                        ) {
                            if (message.decrypted) {
                                message.decrypted.fileIDs.forEach(function (fileID) {
                                    if (Peerio.user.conversations[message.conversationID].fileIDs.indexOf(fileID) < 0) {
                                        Peerio.user.conversations[message.conversationID].fileIDs.push(fileID)
                                    }
                                })
                                var read = [{
                                    id: message.id,
                                    receipt: message.decrypted.receipt,
                                    sender: message.sender
                                }]
                                if (document.hasFocus()) {
                                    Peerio.message.readMessages(read, function () {
                                        $scope.$root.$broadcast('messagesSectionRender', null)
                                    })
                                }
                                else {
                                    $scope.messagesSection.readOnUnfocusedBuffer.push(read[0])
                                }
                            }
                        }
                    }
                    else {
                        Peerio.message.getConversationPages([message.conversationID], true, function () {
                            $scope.$root.$broadcast('messagesSectionRender', null)
                        })
                    }
                });

                if (playReceived) Peerio.notification.playSound('received');
                else if (playAck) Peerio.notification.playSound('ack');

                $scope.$root.$broadcast('messagesSectionRender', null)
                if (modified.length) {
                    $('input.mainTopSearchSubmit').trigger('click')
                    Peerio.network.getSettings(function (data) {
                        Peerio.user.quota = data.quota
                    })
                }
            })
        })
        $scope.$on('messagesSectionRender', function () {
            if (/Sidebar/.test($element[0].className)) {
                return false
            }
            if (window.firstLogin) {
                window.firstLogin = false;
                swal({
                    title: document.l10n.getEntitySync('addAddressSuggestion').value,
                    text: document.l10n.getEntitySync('addAddressSuggestionText').value,
                    type: 'info',
                    showCancelButton: true,
                    cancelButtonText: document.l10n.getEntitySync('cancel').value,
                    //confirmButtonColor: '#e07a66',
                    confirmButtonText: document.l10n.getEntitySync('ok').value,
                    closeOnConfirm: true
                }, function () {
                    Peerio.UI.openSettings();
                });
            }
            $scope.messagesSection.conversations = Peerio.user.conversations
            $scope.$apply(Peerio.UI.applyDynamicElements)
            $('input.mainTopSearchSubmit').trigger('click')
            $('div.messagesSectionMessageViewSingles').scrollTop(
                $('div.messagesSectionMessageViewSingles')[0].scrollHeight + 1000
            )
        })
        $scope.$on('messagesSectionAttachFileIDs', function (event, ids) {
            if (/Sidebar/.test($element[0].className)) {
                return false
            }
            $scope.messagesSection.attachFileIDs = ids
            $scope.$root.$broadcast('frontModalsClose', null)
        })
        $scope.$on('messagesSectionSetSearchFilter', function (event, input) {
            if ($scope.messagesSection.searchFilter === '' && input !== '') {
                //resetting folder to 'all' to be able display all search results
                $scope.messagesSection.setTypeFilter('all', {target: $('#allMessagesFolder')});
            }
            $scope.messagesSection.searchFilter = input.toLowerCase()
            //$scope.$apply()
        })
        $scope.$on('messagesSectionSetTypeFilter', function (event, type) {
            $scope.messagesSection.typeFilter = type
        })
        $scope.messagesSection.checkSearchFilterConversation = function (conversation) {
            var match = false
            for (var message in conversation.messages) {
                if (hasProp(conversation.messages, message)) {
                    match = $scope.messagesSection.checkSearchFilter(conversation.messages[message])
                    if (match) {
                        break
                    }
                }
            }
            return match
        }
        $scope.messagesSection.checkSearchFilter = function (message) {
            if (!$scope.messagesSection.searchFilter.length) {
                return true
            }
            if (
                hasProp(message.decrypted, 'subject') &&
                message.decrypted.subject.toLowerCase().match($scope.messagesSection.searchFilter)
            ) {
                return true
            }
            if (
                hasProp(message.decrypted, 'message') &&
                message.decrypted.message.toLowerCase().match($scope.messagesSection.searchFilter)
            ) {
                return true
            }
            if (message.sender.toLowerCase().match($scope.messagesSection.searchFilter)) {
                return true
            }
            var fullName = Peerio.util.getFullName(message.sender).toLowerCase()
            if (fullName.match($scope.messagesSection.searchFilter)) {
                return true
            }
            var recipientsMatch = false
            message.recipients.forEach(function (recipient) {
                if (
                    hasProp(recipient, 'username') &&
                    (
                        recipient.username.match($scope.messagesSection.searchFilter) ||
                        Peerio.util.getFullName(recipient.username).match($scope.messagesSection.searchFilter)
                    )
                ) {
                    recipientsMatch = true
                }
            })
            return recipientsMatch
        }
        $scope.messagesSection.setTypeFilter = function (type, event) {
            $('ul.messagesSidebarTypeFilters li').removeClass('active')
            $('.messagesSidebar ul.folderView li').removeClass('active')
            $('.messagesSidebar h2').removeClass('active');

            $(event.target).addClass('active')
            $scope.$root.$broadcast('messagesSectionSetTypeFilter', type)
        }
        $scope.messagesSection.checkTypeFilter = function (conversation) {
            if ($scope.messagesSection.typeFilter === 'all') {
                if (!conversation.original.isDraft) {
                    return true
                }
            }
            if ($scope.messagesSection.typeFilter === 'new') {
                if (
                    $scope.messagesSection.conversation &&
                    ($scope.messagesSection.conversation.id === conversation.id) && !conversation.original.isDraft
                ) {
                    return true
                }
                return conversation.original.isModified
            }
            // if ($scope.messagesSection.typeFilter === 'drafts') {
            //   return conversation.original.isDraft
            // }
            if ($scope.messagesSection.typeFilter === 'inbox') return !conversation.folderID;
            if ($scope.messagesSection.typeFilter === conversation.folderID) return true;

        }
        $scope.messagesSection.onCheck = function (id, event) {
            event.stopPropagation()
            if (event.target.checked) {
                $scope.messagesSection.checkedIDs.push(id)
            }
            else {
                var index = $scope.messagesSection.checkedIDs.indexOf(id)
                if (index >= 0) {
                    $scope.messagesSection.checkedIDs.splice(index, 1)
                }
            }
        }
        $scope.messagesSection.selectConversation = function (conversation, event) {
            if (event && (event.target.className === 'blueCheckboxLabel')) {
                return false
            }
            if (!/^\w{16,32}$/.test(conversation.id)) {
                return false
            }
            $('div.mainTopSectionTab[data-sectionlink=messages]').trigger('mousedown')
            $('div.messageListItem').removeClass('selected')
            $scope.$root.$broadcast('attachFileReset', null)
            if (conversation.original.isDraft) {
                $scope.$root.$broadcast('newMessagePopulate', {
                    recipients: conversation.original.decrypted.participants,
                    subject: conversation.original.decrypted.subject,
                    body: conversation.original.decrypted.message,
                    fileIDs: conversation.original.decrypted.fileIDs
                })
                setTimeout(function () {
                    $('button.messagesSidebarNewMessage').trigger('mousedown')
                }, 250)
            }
            else {
                $('div.messageListItem[data-conversationid=c' + conversation.id + ']').addClass('selected')
                if (
                    !$scope.messagesSection.conversation ||
                    (
                        $scope.messagesSection.conversation &&
                        ($scope.messagesSection.conversation.id !== conversation.id)
                    )
                ) {
                    $scope.messagesSection.expandConversation(conversation, false)
                    console.log(conversation.id)
                }
            }
        }
        Peerio.UI.selectConversation = function (conversationID) {
            $scope.messagesSection.selectConversation(Peerio.user.conversations[conversationID], null)
        }
        $scope.messagesSection.getDate = function (timestamp) {
            if (typeof(timestamp) === 'undefined') {
                return ''
            }
            return Peerio.util.getDateFromTimestamp(timestamp)
        }
        $scope.messagesSection.isExpandConversationVisible = function (id, conversation) {
            if (
                (id === conversation.original.id) &&
                (Object.keys(conversation.messages).length < conversation.messageCount)
            ) {
                return true
            }
            return false
        }
        $scope.messagesSection.isValidParticipant = function (username, conversation) {
            if (
                hasProp(conversation, 'original') &&
                (typeof(conversation.original) === 'object') &&
                hasProp(conversation.original, 'decrypted') &&
                hasProp(conversation.original.decrypted, 'participants') &&
                (conversation.original.decrypted.participants.indexOf(username) >= 0)
            ) {
                return true
            }
            return false
        }
        $scope.messagesSection.getMessagesNewCount = function () {
            var count = $('div.messageStatusIndicatorUnread:not(.ng-hide)').length
            if (count !== $scope.messagesSection.messagesNewCount) {
                $scope.messagesSection.messagesNewCount = count
            }
            //

            $scope.$root.convFolders.folders.forEach(function (folder) {
                folder.newMessageCount = 0;
            });
            $scope.$root.convFolders.inboxCounter = 0;
            for (var id in Peerio.user.conversations) {
                if (!Peerio.user.conversations.hasOwnProperty(id)) continue;
                var c = Peerio.user.conversations[id];
                if (c.folderID) {
                    if (c.original && c.original.isModified)
                        $scope.$root.convFolders.foldersMap[c.folderID].newMessageCount++;
                } else if (c.original && c.original.isModified) $scope.$root.convFolders.inboxCounter++;
            }
            //
            return $scope.messagesSection.messagesNewCount
        }
        $scope.messagesSection.getFullName = function (username) {
            return Peerio.util.getFullName(username)
        }
        $scope.messagesSection.getListingName = function (original) {
            if (
                (typeof(original) !== 'object') || !hasProp(original, 'sender')
            ) {
                return Peerio.util.getFullName(Peerio.user.username)
            }
            if (original.sender === Peerio.user.username) {
                if (original.recipients.length === 1) {
                    return Peerio.util.getFullName(original.recipients[0].username)
                }
                else {
                    return (
                        original.recipients.length + ' ' +
                        document.l10n.getEntitySync('recipients').value
                    )
                }
            }
            else {
                return Peerio.util.getFullName(original.sender)
            }
        }
        $scope.messagesSection.expandConversation = function (conversation, entireConversation) {
            if (hasProp($scope.messagesSection, 'conversation')) {
                $scope.messagesSection.replyBuffers[
                    $scope.messagesSection.conversation.id
                    ] = $scope.messagesSection.messageViewReply
                if ($scope.messagesSection.conversation.id !== conversation.id) {
                    $scope.messagesSection.messageViewReply = ''
                }
            }
            $scope.messagesSection.attachFileIDs = []
            $scope.messagesSection.conversationIsLoading = true
            if (!entireConversation) {
                delete $scope.messagesSection.conversation
            }
            conversation.original.isModified = false
            Peerio.storage.db.get('conversations', function (err, conversations) {
                if (
                    (typeof(conversations) === 'object') &&
                    hasProp(conversations, conversation.id)
                ) {
                    var original = conversations[conversation.id].original
                    conversations[conversation.id].messages[original].isModified = false
                    Peerio.storage.db.put(conversations, function () {
                    })
                }
            })
            var afterMessagesAreReceived = function (conversation) {
                $scope.messagesSection.conversation = Peerio.user.conversations[conversation.id]
                $scope.messagesSection.conversationIsLoading = false
                var read = []
                for (var message in Peerio.user.conversations[conversation.id].messages) {
                    if (hasProp(Peerio.user.conversations[conversation.id].messages, message)) {
                        var thisMessage = Peerio.user.conversations[conversation.id].messages[message]
                        if (thisMessage.isModified && thisMessage.decrypted) {
                            read.push({
                                id: thisMessage.id,
                                receipt: thisMessage.decrypted.receipt,
                                sender: thisMessage.sender
                            })
                        }
                        if (!hasProp(Peerio.user.conversations[conversation.id], 'fileIDs')) {
                            Peerio.user.conversations[conversation.id].fileIDs = []
                        }
                        if (thisMessage.decrypted && hasProp(thisMessage.decrypted, 'fileIDs')) {
                            for (var fileID = 0; fileID < thisMessage.decrypted.fileIDs.length; fileID++) {
                                if (Peerio.user.conversations[conversation.id].fileIDs.indexOf(thisMessage.decrypted.fileIDs[fileID]) < 0) {
                                    Peerio.user.conversations[conversation.id].fileIDs.push(thisMessage.decrypted.fileIDs[fileID])
                                }
                            }
                        }
                    }
                }
                if (read.length) {
                    Peerio.message.readMessages(read, function () {
                        $scope.$root.$broadcast('messagesSectionRender', null)
                        $scope.$apply()
                        Peerio.UI.applyDynamicElements()
                    })
                }
                else {
                    $scope.$root.$broadcast('messagesSectionRender', null)
                    $scope.$apply()
                    Peerio.UI.applyDynamicElements()
                }
            }
            if (hasProp($scope.messagesSection.replyBuffers, conversation.id)) {
                $scope.messagesSection.messageViewReply = $scope.messagesSection.replyBuffers[
                    conversation.id
                    ]
            }
            if (entireConversation) {
                Peerio.message.getConversationPages([conversation.id], false, function () {
                    $scope.messagesSection.conversation = Peerio.user.conversations[conversation.id]
                    afterMessagesAreReceived(conversation)
                })
            }
            else {
                $scope.messagesSection.messageViewReplyTabClick()
                if ($scope.messagesSection.fetchedConversations.indexOf(conversation.id) < 0) {
                    Peerio.message.getConversationPages([conversation.id], true, function () {
                        $scope.messagesSection.conversation = Peerio.user.conversations[conversation.id]
                        $scope.messagesSection.conversationIsLoading = false
                        $scope.messagesSection.fetchedConversations.push(conversation.id)
                        afterMessagesAreReceived(conversation)
                        $('div.messagesSectionMessageViewSingles').scrollTop(
                            $('div.messagesSectionMessageViewSingles')[0].scrollHeight + 1000
                        )
                    })
                }
                else {
                    afterMessagesAreReceived(conversation)
                    $('div.messagesSectionMessageViewSingles').scrollTop(
                        $('div.messagesSectionMessageViewSingles')[0].scrollHeight + 1000
                    )
                }
            }
        }
        $scope.messagesSection.messageIsDecrypted = function (message) {
            return hasProp(message, 'decrypted')
        }
        $scope.messagesSection.messageIsAck = function (message) {
            if (message.decrypted.message === ':::peerioAck:::') {
                return true
            }
            return false
        }
        $scope.messagesSection.checkReceipt = function (receipt, recipient, sender) {
            if (
                (sender !== Peerio.user.username) ||
                (!hasProp(recipient, 'receipt'))
            ) {
                return false
            }
            if (!hasProp($scope.messagesSection.checkedReceipts, receipt)) {
                $scope.messagesSection.checkedReceipts[receipt] = []
            }
            if ($scope.messagesSection.checkedReceipts[receipt].indexOf(recipient) >= 0) {
                return true
            }
            if (Peerio.message.checkReceipt(receipt, recipient)) {
                $scope.messagesSection.checkedReceipts[receipt].push(recipient)
                return true
            }
            return false
        }
        $scope.messagesSection.getReceiptTimestamp = function (message, username) {
            var timestamp = ''
            var parsedTimestamp = {}
            if (hasProp(message, 'recipients')) {
                message.recipients.forEach(function (recipient) {
                    if (
                        hasProp(recipient, 'username') &&
                        (recipient.username === username) &&
                        hasProp(recipient, 'receipt') &&
                        hasProp(recipient.receipt, 'readTimestamp') &&
                        (/^\d{13,14}$/).test(recipient.receipt.readTimestamp)
                    ) {
                        timestamp = recipient.receipt.readTimestamp
                        parsedTimestamp = Peerio.util.getDateFromTimestamp(timestamp)
                    }
                })
            }
            if (
                hasProp(parsedTimestamp, 'time') &&
                hasProp(parsedTimestamp, 'date')
            ) {
                if (timestamp > (Date.now() - 86400000)) {
                    return parsedTimestamp.time
                }
                else {
                    return parsedTimestamp.date
                }
            }
            return parsedTimestamp
        }
        $scope.messagesSection.acknowledgeMessage = function (conversation) {
            $scope.messagesSection.messageViewReply = ':::peerioAck:::'
            $scope.messagesSection.replyToConversation(conversation)
        }
        $scope.messagesSection.isOnlyParticipant = function (conversation) {
            if (
                (typeof(conversation) !== 'object') || !hasProp(conversation, 'events')
            ) {
                return false
            }
            var removeCount = 0
            for (var i in conversation.events) {
                if (
                    hasProp(conversation.events, i) &&
                    hasProp(conversation.events[i], 'type') &&
                    conversation.events[i].type === 'remove'
                ) {
                    removeCount++
                }
            }
            if (
                (removeCount > 0) &&
                (conversation.participants.length === 1)
            ) {
                return true
            }
            return false
        }
        $scope.messagesSection.isAckButtonDisabled = function (conversation) {
            if (typeof(conversation) !== 'object') {
                return false
            }
            var message = $('div.messagesSectionMessageViewSingle')
                .last().attr('data-messageid')
            if (message) {
                message = message.substring(1)
            }
            if (
                !message || !hasProp(conversation.messages, message) ||
                (conversation.messages[message].sender === Peerio.user.username)
            ) {
                return true
            }
            if ($scope.messagesSection.isOnlyParticipant(conversation)) {
                return true
            }
            return false
        }
        $scope.messagesSection.attachFile = function (conversation) {
            $scope.$root.$broadcast(
                'attachFilePopulate', {
                    recipients: conversation.original.decrypted.participants,
                    opener: 'messagesSection'
                }
            )
            $('div.frontModalsWrapper').addClass('visible')
            $('div.attachFile').addClass('visible')
            setTimeout(function () {
                $('input.attachFileSearch')[0].focus()
            }, 100)
        };

        function getSecurityParams(messages) {
            var max = 0;
            var secretId = null;
            for (var id in messages) {
                var decrypted = messages[id] && messages[id].decrypted;
                if (typeof decrypted != 'object') continue;

                max = Math.max(decrypted.innerIndex || 0, max);
                if (!secretId) secretId = decrypted.secretConversationId || decrypted.secretConversationID;
            }
            return {maxIndex: max, secretConversationId: secretId || nacl.util.encodeBase64(nacl.randomBytes(32))};
        }

        $scope.messagesSection.replyToConversation = function (conversation) {
            var body = $scope.messagesSection.messageViewReply;
            if (!body.length) return false;
            var securityParams = getSecurityParams(conversation.messages);

            var msgInfo = {
                version: '1.1.0', // new version still backwards compatible
                metadataVersion: '1.1.0',
                isDraft: false,
                recipients: conversation.original.decrypted.participants,
                subject: conversation.original.decrypted.subject,
                body: body,
                fileIDs: $scope.messagesSection.attachFileIDs,
                conversationID: conversation.id,
                innerIndex: securityParams.maxIndex + 1,
                timestamp: Date.now(),
                secretConversationId: securityParams.secretConversationId
            };

            Peerio.message.new(msgInfo, function (messageObject, failed) {
                if (Peerio.user.settings.useSounds)
                    Peerio.notification.playSound(body === ':::peerioAck:::' ? 'ack' : 'sending');

                var temporaryID = 'sending' + Base58.encode(nacl.randomBytes(8));

                messageObject.timestamp = msgInfo.timestamp; //+ 120000;
                messageObject.id = temporaryID;
                messageObject.isModified = false;
                messageObject.sender = Peerio.user.username;
                messageObject.decrypted = {
                    fileIDs: $scope.messagesSection.attachFileIDs,
                    message: body,
                    receipt: '',
                    innerIndex: msgInfo.innerIndex,
                    timestamp: msgInfo.timestamp,
                    secretConversationId: msgInfo.secretConversationId,
                    subject: ''//conversation.original.decrypted.subject
                };

                conversation.messages[temporaryID] = messageObject;

                $scope.$apply(Peerio.UI.applyDynamicElements);
                var el = $('div.messagesSectionMessageViewSingles');
                el.scrollTop(el[0].scrollHeight + 1000);

                Peerio.network.createMessage(messageObject, function (result) {
                    if (hasProp(result, 'error')) {
                        if (result.error === 413) {
                            swal({
                                title: document.l10n.getEntitySync('quotaError').value,
                                text: document.l10n.getEntitySync('quotaErrorText').value,
                                type: 'error',
                                confirmButtonText: document.l10n.getEntitySync('OK').value
                            })
                        }
                        else {
                            swal({
                                title: document.l10n.getEntitySync('error').value,
                                text: document.l10n.getEntitySync('newMessageErrorText').value,
                                type: 'error',
                                confirmButtonText: document.l10n.getEntitySync('OK').value
                            })
                        }
                        delete conversation.messages[temporaryID];
                        $scope.$apply(Peerio.UI.applyDynamicElements);
                        return false
                    }
                    Peerio.message.getMessages([result.id], function (data) {
                        if (body !== ':::peerioAck:::') {
                            if (Peerio.user.settings.useSounds) {
                                Peerio.notification.playSound('sent')
                            }
                        }
                        conversation.messages[result.id] = conversation.messages[temporaryID]
                        delete conversation.messages[temporaryID]
                        conversation.messages[result.id].timestamp = data.messages[result.id].timestamp
                        conversation.messages[result.id].id = result.id
                        conversation.messages[result.id].decrypted = data.messages[result.id].decrypted
                        conversation.lastTimestamp = data.messages[result.id].timestamp
                        Peerio.user.conversations[conversation.id].lastTimestamp = data.messages[result.id].timestamp
                        Peerio.storage.db.get('conversations', function (err, conversations) {
                            if (hasProp(conversations, conversation.id)) {
                                conversations[conversation.id].lastTimestamp = data.messages[result.id].timestamp
                                Peerio.storage.db.put(conversations, function () {
                                })
                            }
                        })
                        $scope.messagesSection.attachFileIDs.forEach(function (fileID) {
                            if (conversation.fileIDs.indexOf(fileID) < 0) {
                                conversation.fileIDs.push(fileID)
                            }
                        })
                        $scope.messagesSection.attachFileIDs = []
                        $scope.$root.$broadcast('attachFileReset', null)
                        $scope.$apply(Peerio.UI.applyDynamicElements)
                    }, true)
                    $scope.$root.$broadcast('frontModalsClose', null)
                })
                if (failed.length) {
                    var swalText = document.l10n.getEntitySync('messageCouldNotBeSentTo').value
                    swalText += failed.join(', ')
                    swal({
                        title: document.l10n.getEntitySync('warning').value,
                        text: swalText,
                        type: 'warning',
                        confirmButtonText: document.l10n.getEntitySync('OK').value
                    })
                } else $scope.messagesSection.messageViewReply = '';

            });
        };
        $scope.messagesSection.removeConversations = function (ids) {
            if (!ids.length && !$scope.messagesSection.conversation) {
                return false
            }
            if (!ids.length) ids = [$scope.messagesSection.conversation.id];
            var removeConversations = function (ids) {
                Peerio.storage.db.get('conversations', function (err, conversations) {
                    Peerio.storage.db.remove(conversations, function () {
                        ids.forEach(function (id) {
                            if (hasProp(conversations, id)) {
                                delete conversations[id]
                            }
                        })
                        Peerio.storage.db.put(conversations, function () {
                        })
                    })
                })
                Peerio.network.removeConversation(ids, function (data) {
                    if (hasProp(data, 'success')) {
                        data.success.forEach(function (s) {
                            if (ids.indexOf(s) >= 0) {
                                delete Peerio.user.conversations[s]
                            }
                        })
                        delete $scope.messagesSection.conversation
                        $scope.messagesSection.conversationIsLoading = false
                        $scope.messagesSection.checkedIDs = []
                        $scope.$apply()
                    }
                })
            }
            swal({
                title: document.l10n.getEntitySync('removeConversationsQuestion').value,
                text: document.l10n.getEntitySync('removeConversationsText').value,
                type: 'warning',
                showCancelButton: true,
                cancelButtonText: document.l10n.getEntitySync('cancel').value,
                confirmButtonColor: '#e07a66',
                confirmButtonText: document.l10n.getEntitySync('remove').value,
                closeOnConfirm: true
            }, function () {
                removeConversations(ids);
                //  $scope.messagesSection.conversation = null;
            });
        };

        $scope.messagesSection.sentByMe = function (message) {
            if (
                (message.sender === Peerio.user.username) &&
                message.decrypted
            ) {
                return true
            }
            return false
        }

        $scope.messagesSection.isFailed = function (message) {
            if (message.sender === Peerio.user.username) {
                return false
            }
            if (
                !(hasProp(message, 'decrypted')) || !message.decrypted
            ) {
                message.decrypted = false
                return true
            }
            if (!/^\w{24,30}$/.test(message.id)) {
                message.decrypted = false
                return true
            }
            return false
        }
        $scope.messagesSection.truncateName = function (fileID) {
            if (hasProp(Peerio.user.files, fileID)) {
                return Peerio.file.truncateFileName(
                    Peerio.user.files[fileID].name
                )
            }
        }
        $scope.messagesSection.getIcon = function (fileID) {
            if (hasProp(Peerio.user.files, fileID)) {
                return $sce.trustAsHtml(
                    Peerio.user.files[fileID].icon
                )
            }
        }
        $scope.messagesSection.doesFileExist = function (fileID) {
            return hasProp(Peerio.user.files, fileID)
        }
        $scope.messagesSection.downloadFile = function (fileID) {
            Peerio.UI.downloadFile.downloadFile(fileID)
        }
        $scope.messagesSection.messageViewReplyTabClick = function () {
            $('span.messagesSectionMessageViewReplyTab').addClass('active')
            $('span.messagesSectionMessageViewFilesTab').removeClass('active')
            $('div.messagesSectionMessageViewReply').show()
            $('div.messagesSectionMessageViewFiles').hide()
            setTimeout(function () {
                $('div.messagesSectionMessageViewReply').find('textarea')[0].focus()
            }, 200)
        }
        $scope.messagesSection.messageViewFilesTabClick = function () {
            $('span.messagesSectionMessageViewFilesTab').addClass('active')
            $('span.messagesSectionMessageViewReplyTab').removeClass('active')
            $('div.messagesSectionMessageViewReply').hide()
            $('div.messagesSectionMessageViewFiles').show()
        }
        $(window).on('focus', function () {
            if ($scope.messagesSection.readOnUnfocusedBuffer.length) {
                Peerio.message.readMessages($scope.messagesSection.readOnUnfocusedBuffer, function () {
                    $scope.messagesSection.readOnUnfocusedBuffer = []
                    $scope.$root.$broadcast('messagesSectionRender', null)
                })
            }
        })
    }
)