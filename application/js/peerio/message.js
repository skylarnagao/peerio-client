// ---------------------
// Peerio.message
// ---------------------
//
// Peerio's message object contains functions and information
// regarding the sending and management of messages.


Peerio.message = {};

(function () {
    'use strict';

    /**
     * Given a string, match it to a contact.
     * Useful for the "To" input field in the New Message modal.
     * @param {string} input
     * @return {Array}
     */
    Peerio.message.toAutocomplete = function (input) {
        var result = [];
        if (!input) {
            return result;
        }
        var exp = new RegExp('^' + input, 'i');
        for (var i in Peerio.user.contacts) {
            if (hasProp(Peerio.user.contacts, i)
                && !Peerio.user.contacts[i].isRequest
                && !Peerio.user.contacts[i].isDeleted) {
                var contact = Peerio.user.contacts[i];

                if (contact.username.match(exp) || contact.firstName.match(exp) || contact.lastName.match(exp) ||
                    (contact.primaryAddress && contact.primaryAddress.match(exp))) {
                    result.push(contact);
                    continue;
                }

                for (var a = 0; a < contact.addresses.length; a++) {
                    if (contact.addresses[a].value.match(exp)) {
                        result.push(contact);
                        break;
                    }
                }
            }
        }
        return result;
    };

    /**
     * Creates an encrypted message ready to be sent via Peerio.network.createMessage.
     * @param {object) messageInfo - {
	 *  isDraft: Boolean indicating if message is draft,
	 *  recipients: Array of recipient usernames,
	 *  subject: Message subject (String),
	 *  body: Message body (String),
	 *  conversationID: Conversation ID of message, optional (String),
	 *  fileIDs: Array of file IDs of attached files,
	 * }
     * @param {function} callback - Returns with object ready for Peerio.network.createMessage.
     */
    Peerio.message.new = function (messageInfo, callback) {
        var createMessage = function () {
            var message = {
                version: messageInfo.version,
                metadataVersion: messageInfo.metadataVersion,
                subject: messageInfo.subject,
                message: messageInfo.body,
                receipt: nacl.util.encodeBase64(nacl.randomBytes(32)),
                fileIDs: messageInfo.fileIDs,
                participants: messageInfo.recipients,
                innerIndex: messageInfo.innerIndex,
                secretConversationId: messageInfo.secretConversationId,
                timestamp: messageInfo.timestamp
            };

            var encryptRecipients = messageInfo.recipients;
            if (messageInfo.isDraft) {
                encryptRecipients = [Peerio.user.username]
            }
            Peerio.crypto.encryptMessage(
                message,
                encryptRecipients,
                function (header, body, failed) {
                    if ((!header || !body) && typeof(callback) === 'function')
                        callback(false);

                    var messageObject = {
                        version: messageInfo.metadataVersion,
                        isDraft: messageInfo.isDraft,
                        recipients: messageInfo.recipients,
                        header: header,
                        body: body,
                        files: files,
                        timestamp: messageInfo.timestamp,
                        outerIndex: messageInfo.innerIndex
                    };

                    if (hasProp(messageInfo, 'conversationID')) {
                        messageObject.conversationID = messageInfo.conversationID
                    }

                    if (typeof(callback) === 'function') {
                        callback(messageObject, failed)
                    }
                }
            );
        };

        var files = [];

        messageInfo.fileIDs.forEach(function (fileID) {
            Peerio.file.generateNewHeader(messageInfo.recipients, fileID,
                function (header) {
                    files.push({id: fileID, header: header});
                }
            );
        });
        createMessage();
    };

    /**
     * Retrieve and organize a single thread.
     * Progressively adds decrypted messages to Peerio.user.conversations[id].messages.
     * @param {array} ids - Conversation IDs
     * @param {boolean} getOnlyLastTenMessages - if false, gets all messages *except* last ten.
     * @param {function} onComplete
     */
    Peerio.message.getConversationPages = function (ids, getOnlyLastTenMessages, onComplete) {
        var decryptedCount = 0
        var keys = []
        var page = getOnlyLastTenMessages ? 0 : 1
        var beginDecrypt = function (data, id) {
            if (Object.keys(data.messages).length === 0) {
                if (typeof(onComplete) === 'function') {
                    onComplete(Peerio.user.conversations[id])
                }
                return false
            }
            for (var message in data.messages) {
                if (hasProp(data.messages, message)) {
                    Peerio.user.conversations[id].messages[message] = data.messages[message]
                }
            }
            Peerio.user.conversations[id].messageCount = data.messageCount
            keys = keys.concat(data.pagination.messageOrder)
            decryptMessage(data.messages[keys[decryptedCount]], id)
        }
        var decryptMessage = function (message, id) {
            if (
                (typeof(message) !== 'object')
            ) {
                decryptedCount++
                if (decryptedCount === keys.length) {
                    if (typeof(onComplete) === 'function') {
                        onComplete(Peerio.user.conversations[id])
                    }
                }
                else {
                    decryptMessage(Peerio.user.conversations[id].messages[keys[decryptedCount]], id)
                }
            }
            else {
                Peerio.crypto.decryptMessage(message, function (decrypted) {
                    Peerio.user.conversations[id].messages[message.id].decrypted = decrypted
                    decryptedCount++
                    if (decryptedCount === keys.length) {
                        if (typeof(onComplete) === 'function') {
                            onComplete(Peerio.user.conversations[id])
                        }
                    }
                    else {
                        decryptMessage(Peerio.user.conversations[id].messages[keys[decryptedCount]], id)
                    }
                })
            }
        }
        var requestArray = []
        ids.forEach(function (id) {
            requestArray.push({
                id: id,
                page: page
            })
        })
        Peerio.network.getConversationPages(requestArray, function (data) {
            var missingOriginals = {}
            if (!hasProp(data, 'conversations')) {
                onComplete(false)
                return false
            }
            for (var id in data.conversations) {
                if (hasProp(data.conversations, id)) {
                    if (
                        !hasProp(Peerio.user.conversations, id)
                    ) {
                        Peerio.user.conversations[id] = data.conversations[id]
                        missingOriginals[data.conversations[id].original] = id
                    }
                }
            }
            if (Object.keys(missingOriginals).length) {
                Peerio.network.getMessages(Object.keys(missingOriginals), function (originals) {
                    for (var original in originals.messages) {
                        if (hasProp(originals.messages, original)) {
                            Peerio.user.conversations[missingOriginals[original]].original = originals.messages[original]
                            Peerio.user.conversations[missingOriginals[original]].messages[
                                Peerio.user.conversations[missingOriginals[original]].original.id
                                ] = Peerio.user.conversations[missingOriginals[original]].original
                        }
                    }
                    beginDecrypt(data.conversations[missingOriginals[original]], missingOriginals[original])
                })
            }
            else {
                beginDecrypt(data.conversations[id], id)
            }
        })
    }

    /**
     * Mark message(s) as read, send read receipt(s) if applicable.
     * @param {array} read - filled with objects each containing {id, receipt, sender}
     * @param {function} callback
     */
    Peerio.message.readMessages = function (read, callback) {
        var encryptedRead = []
        var pushEncryptedReceipt = function (message) {
            var receipt = message.receipt.toString() + Date.now()
            var nonce = miniLock.crypto.getNonce()
            receipt = nacl.box(
                nacl.util.decodeUTF8(receipt),
                nonce,
                Peerio.crypto.getPublicKeyFromMiniLockID(message.senderID),
                Peerio.user.keyPair.secretKey
            )
            receipt = nacl.util.encodeBase64(receipt) + ':' + nacl.util.encodeBase64(nonce)
            encryptedRead.push({
                id: message.id,
                encryptedReturnReceipt: receipt
            })
            if (encryptedRead.length === read.length) {
                Peerio.network.readMessages(encryptedRead, callback)
            }
        }
        read.forEach(function (message) {
            if (message.sender === Peerio.user.username) {
                message.senderID = Peerio.user.miniLockID
            }
            else if (
                hasProp(Peerio.user.contacts, message.sender) &&
                hasProp(Peerio.user.contacts[message.sender], 'miniLockID')
            ) {
                message.senderID = Peerio.user.contacts[message.sender].miniLockID
            }
            pushEncryptedReceipt(message)
        })
    }

    /**
     * Compare return receipts and return if they match.
     * @param {string} original - Original receipt, Base64 string
     * @param {object} recipient - object for particular recipient from message.recipients
     * @return {boolean} Whether receipts match.
     */
    Peerio.message.checkReceipt = function (original, recipient) {
        if (
            (typeof(recipient.receipt.encryptedReturnReceipt) !== 'string') ||
            (recipient.receipt.encryptedReturnReceipt.length < 16)
        ) {
            return false
        }
        var encryptedReturnReceipt = recipient.receipt.encryptedReturnReceipt.split(':')
        if (
            (encryptedReturnReceipt.length !== 2) ||
            (typeof(encryptedReturnReceipt) !== 'object')
        ) {
            return false
        }
        if (hasProp(Peerio.user.contacts, recipient.username)) {
            var decrypted = nacl.box.open(
                nacl.util.decodeBase64(encryptedReturnReceipt[0]),
                nacl.util.decodeBase64(encryptedReturnReceipt[1]),
                Peerio.crypto.getPublicKeyFromMiniLockID(
                    Peerio.user.contacts[recipient.username].miniLockID
                ),
                Peerio.user.keyPair.secretKey
            )
            if (!decrypted) {
                return false
            }
            decrypted = nacl.util.encodeUTF8(decrypted)
            decrypted = decrypted.substring(0, decrypted.length - 13)
            if (decrypted === original) {
                return true
            }
            else {
                return false
            }
        }
        else {
            return false
        }
    }

    var protocolChangeDate = 1458424800000;// 20 Feb 2016, aprrox. date at which all clients should be able to speak '1.1.0' protocol
    function verifyMetadata(msg, previous, skipOrder) {
        if (!msg.timestamp) {
            console.error(msg, 'Message has no timestamp');
            return false;
        }


        if (!Number.isInteger(msg.timestamp)) {
            console.error(msg, 'Incorrect timestamp');
            return false;
        }

        if (msg.version !== '1.1.0') {
            // old protocol messages could have been sent before protocolChangeDate
            if (msg.timestamp > protocolChangeDate) {
                console.error(msg, 'Wrong message metadata version.');
                return false;
            }
            return true;
        }

        if (!Number.isInteger(msg.outerIndex)) {
            console.log(msg, 'OuterIndex is missing.');
            return false;

        }
        // no previous message means we are verifying the first message in conversation
        if (!previous && !skipOrder && msg.outerIndex !== 0) {
            console.error(msg, 'Original message should have outerIndex 0');
            return false;
        }

        if (previous) {
            if (msg.outerIndex - previous.outerIndex > 1) {
                console.error(msg, previous, 'Index mismatch');
                return false;
            }
            if (msg.timestamp < previous.timestamp && (previous.timestamp - msg.timestamp) > 120000) {
                console.error(msg, previous, 'Timestamp mismatch');
                return false;
            }
        }
        return true;
    }

    function verifyDecryptedMessage(metadata, message, previous) {
        if (message.version !== '1.1.0') {
            // old protocol messages could have been sent before protocolChangeDate
            var c = Peerio.user.conversations[message.conversationID];
            if (c && c.timestamp > protocolChangeDate) {
                console.error(msg, 'Wrong message metadata version.');
                return false;
            }
            return true;
        }

        if (message.metadataVersion != metadata.version) {
            console.error('Metadata versions mismatch for message id ' + metadata.id);
            return false;
        }

        if (!message.secretConversationId) {
            console.log(message, 'secretConversationId is missing.');
            return false;
        }

        if (metadata.outerIndex !== message.innerIndex) {
            console.error(metadata, message, "Metadata and message indexes do not match.");
            return false;
        }

        if (Math.abs(metadata.timestamp - message.timestamp) > 120000) {
            console.error(metadata, message, "Metadata and message timestamps do not match.");
            return false;
        }

        if (previous && previous.secretConversationId !== message.secretConversationId) {
            console.error(message, previous, "secretConversationId does not match");
            return false;
        }
        return true;
    }

    /**
     * Retrieve and organize original conversations.
     * Update locally stored conversations object for user.
     * @param {function} callback
     * @param {object} conversations - Optionally, pass a pre-fetched conversations object to decrypt that instead.
     */
    Peerio.message.getAllConversations = function (callback, conversations) {
        var keys = []
        var decryptedCount = 0
        var addConversation = function (conversation) {
            conversation.original = conversation.messages[conversation.original]
            if (!verifyMetadata(conversation.original)) {
                decryptedCount++;
                if (decryptedCount === keys.length) {
                    if (typeof(callback) === 'function') {
                        callback(conversations)
                    }
                }
                else {
                    addConversation(conversations[keys[decryptedCount]])
                }
            }
            Peerio.crypto.decryptMessage(conversation.original, function (decrypted) {
                if (verifyDecryptedMessage(conversation.original, decrypted)) {
                    conversation.original.decrypted = decrypted
                } else if (hasProp(conversation.original)) {
                    conversation.original.decrypted = false
                }
                if (hasProp(Peerio.user.conversations, conversation.id)) {
                    Peerio.user.conversations[conversation.id].lastTimestamp = conversation.lastTimestamp
                    Peerio.user.conversations[conversation.id].events = conversation.events
                    Peerio.user.conversations[conversation.id].participants = conversation.participants
                }
                else {
                    Peerio.user.conversations[conversation.id] = conversation
                }
                decryptedCount++
                if (decryptedCount === keys.length) {
                    if (typeof(callback) === 'function') {
                        callback(conversations)
                    }
                }
                else {
                    addConversation(conversations[keys[decryptedCount]])
                }
            })
        };
        if (conversations) {
            Peerio.network.getConversationIDs(function (IDs) {
                if (hasProp(IDs, 'conversationID')) {
                    IDs = IDs.conversationID
                    var missingConversations = []
                    IDs.forEach(function (ID) {
                        if (!hasProp(conversations, ID)) {
                            missingConversations.push(ID)
                        }
                    })
                    if (missingConversations.length) {
                        console.log('Missing conversations detected')
                        Peerio.message.getConversationPages(missingConversations, true, function () {
                        })
                    }
                    for (var i in conversations) {
                        if (
                            hasProp(conversations, i) &&
                            (IDs.indexOf(i) < 0)
                        ) {
                            delete conversations[i]
                        }
                    }
                    delete conversations._id
                    delete conversations._rev
                    keys = Object.keys(conversations)
                    if (!keys.length) {
                        if (typeof(callback) === 'function') {
                            callback({})
                        }
                    }
                    else {
                        addConversation(conversations[keys[decryptedCount]])
                    }
                }
            })
        }
        else {
            conversations = {}
            Peerio.network.getAllConversations(function (data) {
                Peerio.storage.db.get('conversations', function (err, old) {
                    Peerio.storage.db.remove(old, function () {
                        conversations = data.conversations
                        conversations._id = 'conversations'
                        console.log('Storing new conversation cache')
                        Peerio.storage.db.put(conversations, function () {
                            delete conversations._id
                            keys = Object.keys(conversations)
                            if (!keys.length) {
                                if (typeof(callback) === 'function') {
                                    callback({})
                                }
                            }
                            else {
                                addConversation(conversations[keys[decryptedCount]])
                            }
                        })
                    })
                })
            })
        }
    }


    /**
     * Retrieve messages by their IDs and decrypt them.
     * Also adds ephemeral keys to Peerio.user.ephemerals.
     * @param {array} ids
     * @param {function} callback
     * @param {boolean} [modified] - true if call was made for modified messages, which are unordered, so we'll skip order verification
     */
    Peerio.message.getMessages = function (ids, callback, modified) {
        Peerio.network.getMessages(ids, function (data) {
            var keys = Object.keys(data.messages);

            var decryptNextMessage = function (count) {
                if (count >= keys.length) {
                    callback(data);
                    return;
                }

                var message = data.messages[keys[count]];
                var prev = modified ? null : (count > 0 ? data.messages[keys[count - 1]] : Peerio.user.conversations[message.conversationID].original);

                if (!verifyMetadata(message, prev, modified)) {
                    delete data.messages[keys[count]];
                    decryptNextMessage(count);
                }
                Peerio.crypto.decryptMessage(message, function (decrypted) {
                    count++;
                    // protocol validation
                    if (decrypted && (message.version === '1.1.0' || decrypted.version === '1.1.0')) {
                        var prevMsg = null;
                        if (!modified) {
                            if (count > 1) {
                                prevMsg = data.messages[keys[count - 2]];
                                prevMsg = prevMsg && prevMsg.decrypted || null;
                            } else {
                                prevMsg = Peerio.user.conversations[message.conversationID];
                                prevMsg = prevMsg && prevMsg.original && prevMsg.decrypted || null;
                            }
                        }

                        if ((!modified && !prevMsg) || !verifyDecryptedMessage(message, decrypted, prevMsg, modified)) {
                            console.log('Failed to validate message: ', message);
                            delete data.messages[keys[count - 1]];
                            decryptNextMessage(count);
                            return;
                        }
                    }

                    if (decrypted === false) {
                        console.log('Failed to decrypt message: ', message);
                        delete data.messages[keys[count - 1]];
                        decryptNextMessage(count);
                        return;
                    }


                    if (typeof(message) !== 'object') {
                        if (count === keys.length) {
                            callback(data)
                        }
                        else {
                            decryptNextMessage(count)
                        }
                        return false
                    }


                    message.decrypted = decrypted
                    if (hasProp(message.decrypted, 'fileIDs')) {
                        Peerio.file.getFile(message.decrypted.fileIDs, function (fileData) {
                            for (var file in fileData) {
                                if (hasProp(fileData, file)) {
                                    if (fileData[file] === 'error') {
                                        message.decrypted.fileIDs.splice(
                                            message.decrypted.fileIDs.indexOf(file), 1
                                        )
                                    }
                                    else {
                                        Peerio.user.files[file] = fileData[file]
                                    }
                                }
                            }
                            if (count === keys.length) {
                                callback(data)
                            }
                            else {
                                decryptNextMessage(count)
                            }
                        })
                    }
                    else {
                        if (count === keys.length) {
                            callback(data)
                        }
                        else {
                            decryptNextMessage(count);
                        }
                    }
                })
            }
            decryptNextMessage(0)
        })
    }

    /**
     * Retrieve unopened/modified messages.
     * @param {function} callback
     */
    Peerio.message.getModifiedMessages = function (callback) {
        var modified = []
        Peerio.network.getModifiedMessageIDs(function (IDs) {
            if (
                (typeof(IDs) !== 'object') ||
                hasProp(IDs, 'error') || !hasProp(IDs, 'messageIDs') ||
                (typeof(IDs.messageIDs) !== 'object') || !IDs.messageIDs.length
            ) {
                callback(modified)
                return false
            }
            IDs = IDs.messageIDs
            var undownloadedIDs = []
            for (var i = 0; i < IDs.length; i++) {
                undownloadedIDs.push(IDs[i])
            }
            if (!undownloadedIDs.length) {
                if (typeof(callback) === 'function') {
                    callback(modified)
                }
                return false
            }
            console.log(undownloadedIDs)
            Peerio.message.getMessages(undownloadedIDs, function (messages) {
                messages = messages.messages
                for (var i in messages) {
                    if (hasProp(messages, i)) {
                        modified.push(messages[i])
                    }
                }
                callback(modified)
            }, true);
        })
    }

})()