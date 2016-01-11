'use strict';

importScripts('../lib/socket.js')

var mySocket = (function() {
	var server = 'wss://app.peerio.com:443';

	return io.connect(server, { transports: ['websocket'] })
}());

onmessage = function(message) {
	message = message.data
	mySocket.emit(message.name, message.content, function(data) {
		postMessage({
			callbackID: message.callbackID,
			data: data
		})
	})
}

mySocket.on('receivedContactRequestsAvailable', function() {
	postMessage({
		received: 'receivedContactRequestsAvailable'
	})
})

mySocket.on('modifiedMessagesAvailable', function() {
	postMessage({
		received: 'modifiedMessagesAvailable'
	})
})

mySocket.on('uploadedFilesAvailable', function() {
	postMessage({
		received: 'uploadedFilesAvailable'
	})
})

mySocket.on('modifiedConversationsAvailable', function() {
	postMessage({
		received: 'modifiedConversationsAvailable'
	})
})

mySocket.on('newContactsAvailable', function() {
	postMessage({
		received: 'newContactsAvailable'
	})
})

mySocket.on('sentContactRequestsAvailable', function() {
	postMessage({
		received: 'sentContactRequestsAvailable'
	})
})

mySocket.on('contactsAvailable', function() {
	postMessage({
		received: 'contactsAvailable'
	})
})

mySocket.on('connect_error', function() {
	postMessage({
		received: 'error'
	})
})

mySocket.on('reconnecting', function() {
	postMessage({
		received: 'reconnecting'
	})	
})

mySocket.on('reconnect', function() {
	postMessage({
		received: 'reconnect'
	})
})