// ---------------------
// Peerio.socket
// ---------------------
//
// Peerio's socket object is an initialized WebSockets connection to
// a Peerio Server Application.

Peerio.socket = {};

(function() {
	'use strict';

	Peerio.socket.worker = new Worker('js/peerio/socketworker.js')

	Peerio.socket.callbacks = {}
    var warningQueue = [];
	var warningActive = false;
	Peerio.socket.worker.onmessage = function(message) {
		message = message.data
		if (
			hasProp(message, 'callbackID') &&
			message.callbackID
		) {
			// Handle global errors affecting all calls:
			if (hasProp(message.data, 'error')) {
				if (message.data.error === 423) {
					Peerio.user.authTokens = []
					Peerio.network.getAuthTokens(Peerio.crypto.decryptAuthTokens)
				}
				else if (message.data.error === 424) {
					Peerio.UI.twoFactorAuth(function() {
						Peerio.socket.callbacks[message.callbackID](message.data)
						setTimeout(function() {
							delete Peerio.socket.callbacks[message.callbackID]
						}, 1000)
					})
					return false
				}
				else if (message.data.error === 425) {
					Peerio.UI.showRateLimitedAlert()
					return false
				}
				else if (message.data.error === 426) {
					Peerio.UI.showBlacklistedAlert()
					return false
				} else if (message.data.error === 442) {
					Peerio.UI.showTimeSyncAlert()
					return false
				}
			}
			Peerio.socket.callbacks[message.callbackID](message.data)
			setTimeout(function() {
				delete Peerio.socket.callbacks[message.callbackID]
			}, 1000)
		}

		function showServerWarning(){
			warningActive = true;
			if(warningQueue.length===0){
				warningActive = false;
				return;
			}
			var data = warningQueue.shift();
			swal({
				title: '',
				text: data && data.msg || '',
				type: 'warning',
				confirmButtonText: document.l10n.getEntitySync('OK').value
			}, function () {
				if(data && data.token) Peerio.socket.emit('clearWarning', {token: data.token, authToken: Peerio.user.popAuthToken()});
				if(warningQueue.length>0) {
					window.setTimeout(showServerWarning, 1000);
				} else warningActive = false;
			})
		}

		if (hasProp(message, 'received')) {

			if (message.received === 'serverWarning'){
				if(!message || !message.data || !message.data.msg) return;
				warningQueue.push(message.data);
				if(!warningActive) showServerWarning();
			}
			if (message.received === 'settingsUpdated'){
				Peerio.network.getSettings(function(data) {
					Peerio.user.quota = data.quota;
					Peerio.user.subscriptions = data.subscriptions;
					Peerio.UI.userMenuPopulate();
				})

			}
			if (message.received === 'receivedContactRequestsAvailable') {
				console.log('receivedContactRequestsAvailable')
				Peerio.UI.contactsSectionPopulate()
			}
			if (message.received === 'modifiedMessagesAvailable') {
				console.log('modifiedMessagesAvailable')
				Peerio.UI.messagesSectionUpdate()
			}
			if (message.received === 'uploadedFilesAvailable') {
				console.log('uploadedFilesAvailable')
				Peerio.UI.filesSectionPopulate()
			}
			if (message.received === 'modifiedConversationsAvailable') {
				console.log('modifiedConversationsAvailable')
				Peerio.message.getAllConversations()
			}
			if (message.received === 'newContactsAvailable') {
				console.log('newContactsAvailable')
				Peerio.UI.contactsSectionPopulate()
			}
			if (message.received === 'sentContactRequestsAvailable') {
				console.log('sentContactRequestsAvailable')
				Peerio.UI.contactsSectionPopulate()
			}
			if (message.received === 'contactsAvailable') {
				console.log('contactsAvailable')
				Peerio.UI.contactsSectionPopulate()
			}
			if (message.received === 'error') {
				console.log('Peerio.socket: Connection error.')
			}
			if (message.received === 'reconnecting') {
				console.log('Peerio.socket: Reconnecting.')
				Peerio.UI.onSocketReconnecting()
			}
			if (message.received === 'reconnect') {
				console.log('Peerio.socket: Reconnected.')
				Peerio.UI.onSocketReconnect()
			}
		}

	}

	Peerio.socket.emit = function(name, content, callback) {
		var callbackID = null
		if (typeof(callback) === 'function') {
			callbackID = Base58.encode(nacl.randomBytes(32))
			Peerio.socket.callbacks[callbackID] = callback
		}
		var post = {
			name: name,
			content: content,
			callbackID: callbackID
		}
		var transfer = []
		if (name === 'uploadFileChunk') {
			transfer.push(post.content.ciphertext)
		}
		// Automatically recharge authTokens if we're close to running out.
		if (
			hasProp(content, 'authToken') &&
			(Peerio.user.authTokens.length < 5)
		) {
			Peerio.network.getAuthTokens(function(authTokens) {
				Peerio.crypto.decryptAuthTokens(authTokens)
				Peerio.socket.worker.postMessage(post, transfer)
			})
		}
		else {
			Peerio.socket.worker.postMessage(post, transfer)
		}
	}

})()
