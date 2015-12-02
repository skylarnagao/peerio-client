// ---------------------
// Peerio.user
// ---------------------
//
// Peerio's user object contains the user's current session information
// as well as some functions for managing the user session.

Peerio.user = {};

(function() {
	'use strict';

	Peerio.user = {
		username: '',
		firstName: '',
		lastName: '',
		addresses: [],
		keyPair: {},
		miniLockID: '',
		authTokens: [],
		TOFU: {},
		PIN: false,
		contacts: {},
		conversations: {},
		files: {},
		settings: {
			localeCode: 'en',
			receiveMessageNotifications: false,
			useSounds: true,
			sendReadReceipts: true,
			twoFactorAuth: false
		},
		quota: {
			total: 0,
			user: 0
		}
	}

	/**
	 * Creates and sets the session key pair and miniLock ID, then executes a callback.
	 * @param {string} passhrase
	 * @param {string} username
	 * @param {function} callback
	 */
	Peerio.user.setKeyPair = function(passphrase, username, callback) {
		miniLock.crypto.getKeyPair(passphrase, username, function(keyPair) {
			Peerio.user.username = username
			Peerio.user.keyPair = keyPair
			Peerio.user.miniLockID = miniLock.crypto.getMiniLockID(keyPair.publicKey)
			if (typeof(callback) === 'function') {
				callback()
			}
		})
	}

	/**
	 * Set a PIN for this device, set it as Peerio.user.PIN.
	 * @param {string} PIN
	 * @param {string} username
	 * @param {function} callback - contains PIN as parameter.
	 */
	Peerio.user.setPIN = function(PIN, username, callback) {
		if (typeof(Peerio.user.keyPair.secretKey) !== 'object') {
			throw new Error('Peerio.user.setPIN: Could not find Peerio.user.keyPair.secret.')
			return false
		}
		Peerio.crypto.getKeyFromPIN(PIN, username, function(keyBytes) {
			Peerio.user.PIN = Peerio.crypto.secretBoxEncrypt(
				Peerio.user.keyPair.secretKey,
				keyBytes
			)
			Peerio.storage.db = new PouchDB(username, Peerio.storage.options)
			Peerio.storage.db.get('PIN', function(err, data) {
				if (typeof(data) === 'object') {
					Peerio.storage.db.remove(data, function() {
						data = {
							_id: 'PIN',
							PIN: Peerio.user.PIN
						}
						Peerio.storage.db.put(data, function() {
							if (typeof(callback) === 'function') {
								callback(Peerio.user.PIN)
							}
						})
					})
				}
				else {
					data = {
						_id: 'PIN',
						PIN: Peerio.user.PIN
					}
					Peerio.storage.db.put(data, function() {
						if (typeof(callback) === 'function') {
							callback(Peerio.user.PIN)
						}
					})
				}
			})
		})
	}

	/**
	 * Retrieves the PIN information of a particular username,
	 * stores it in Peerio.user.PIN and executes a callback.
	 * @param {string} username
	 * @param {function} callback - with boolean of whether a PIN was found.
	 */
	Peerio.user.getPIN = function(username, callback) {
		Peerio.storage.db.get('PIN', function(err, data) {
			if (
				typeof(data) === 'object' &&
				hasProp(data, 'PIN') &&
				typeof(data['PIN']) === 'object' &&
				hasProp(data.PIN, 'ciphertext') &&
				hasProp(data.PIN, 'nonce')
			) {
				Peerio.user.PIN = {
					ciphertext: Peerio.util.objectToUint8Array(data['PIN'].ciphertext),
					nonce: Peerio.util.objectToUint8Array(data['PIN'].nonce)
				}
			}
			if (typeof(callback) === 'function') {
				callback(!!Peerio.user.PIN)
			}
		})
	}

	/**
	 * Sets a TOFU object for this device, set it as Peerio.user.TOFU.
	 * @param {object} TOFU
	 * @param {string} username
	 * @param {function} callback
	 */
	Peerio.user.setTOFU = function(TOFU, username, callback) {
		if (typeof(Peerio.user.keyPair.secretKey) !== 'object') {
			throw new Error('Peerio.user.setTOFU: Could not find Peerio.user.keyPair.secret.')
			return false
		}
		var encryptedTOFU = Peerio.crypto.secretBoxEncrypt(
			nacl.util.decodeUTF8(JSON.stringify(TOFU)),
			Peerio.user.keyPair.secretKey
		)
		Peerio.storage.db.get('TOFU', function(err, data) {
			if (typeof(data) === 'object') {
				Peerio.storage.db.remove(data, function() {
					data = {
						_id: 'TOFU',
						TOFU: encryptedTOFU
					}
					Peerio.storage.db.put(data, function() {
						if (typeof(callback) === 'function') {
							callback(TOFU)
						}
					})
				})
			}
			else {
				data = {
					_id: 'TOFU',
					TOFU: encryptedTOFU
				}
				Peerio.storage.db.put(data, function() {
					if (typeof(callback) === 'function') {
						callback(TOFU)
					}
				})
			}
			Peerio.storage.db.put(data, function() {})
			if (typeof(callback) === 'function') {
				callback(TOFU)
			}
		})
	}

	/**
	 * Retrieves TOFU information for contacts on this device,
	 * stores it in Peerio.user.TOFU and executes a callback.
	 * @param {string} username
	 * @param {function} callback - with boolean of whether TOFU information was found.
	 */
	Peerio.user.getTOFU = function(username, callback) {
		Peerio.storage.db.get('TOFU', function(err, data) {
			var TOFU = false
			var parsed = false
			if (
				(typeof(data) === 'object') &&
				hasProp(data, 'TOFU') &&
				(typeof(data['TOFU']) === 'object')
			) {
				TOFU = Peerio.crypto.secretBoxDecrypt(
					Peerio.util.objectToUint8Array(data.TOFU.ciphertext),
					Peerio.util.objectToUint8Array(data.TOFU.nonce),
					Peerio.user.keyPair.secretKey
				)
				if (TOFU) {
					try {
						parsed = JSON.parse(nacl.util.encodeUTF8(TOFU))
					}
					catch(err) {
						TOFU = false
						parsed = false
					}
				}
				if (TOFU && parsed) {
					Peerio.user.TOFU = parsed
				}
				else {
					Peerio.user.TOFU = false
				}
			}
			if (typeof(callback) === 'function') {
				callback(!!TOFU && !!parsed)
			}
		})
	}

	/**
	 * Remove PIN of a user.
	 * @param {string} username
	 * @param {function} callback
	 */
	Peerio.user.removePIN = function(username, callback) {
		Peerio.storage.db.get('PIN', function(err, data) {
			if (
				(typeof(data) === 'object') &&
				hasProp(data, 'PIN')
			) {
				Peerio.storage.db.remove(data, function() {
					if (typeof(callback) === 'function') {
						callback()
					}
				})
			}
		})
	}

	/**
	 * Send account registration request, then
	 * obtain accountCreationToken, decrypt it and send it back.
	 * @param {string} username
	 * @param {object} accountInfo - Contains username, firstName, lastName, address, miniLockID and localeCode
	 * @param {function} callback - executed in case of successful accountCreationToken decryption
	 * @param {function} errorCallback - executed in case of error
	 */
	Peerio.user.registerAccount = function(username, accountInfo, callback, errorCallback) {
		Peerio.network.registerAccount({
			username: username,
			firstName: accountInfo.firstName,
			lastName: accountInfo.lastName,
			//address: accountInfo.address,
			miniLockID: accountInfo.miniLockID,
			localeCode: Peerio.UI.localeCode
		}, function(data) {
			if (hasProp(data, 'error')) {
				if (typeof(errorCallback) === 'function') {
					errorCallback(data)
				}
				return false
			}
			var decryptedToken = Peerio.crypto.decryptAccountCreationToken(data)
			Peerio.network.returnAccountCreationToken(decryptedToken, function(data) {
				if (typeof(callback) === 'function') {
					callback(data)
				}
			})
		})
	}

	/**
	 * Performs initial login for user using a provided passphrase and
	 * a value that may either be their passphrase or PIN (we determine which).
	 * @param {string} username
	 * @param {string} passOrPIN
	 * @param {boolean} skipPIN - Skip PIN check
	 * @param {function} callback
	 */
	Peerio.user.login = function(username, passOrPIN, skipPIN, callback) {
		Peerio.user.getPIN(username, function(PINExists) {
			if (PINExists && !skipPIN) {
				Peerio.crypto.getKeyFromPIN(passOrPIN, username, function(keyBytes) {
					var PINDecryptSuccess = Peerio.crypto.secretBoxDecrypt(
						Peerio.user.PIN.ciphertext,
						Peerio.user.PIN.nonce,
						keyBytes
					)
					if (PINDecryptSuccess) {
						Peerio.user.keyPair = nacl.box.keyPair.fromSecretKey(PINDecryptSuccess)
						Peerio.user.username = username
						Peerio.user.miniLockID = miniLock.crypto.getMiniLockID(
							Peerio.user.keyPair.publicKey
						)
						Peerio.network.getAuthTokens(function(authTokens) {
							Peerio.crypto.decryptAuthTokens(authTokens)
							if (typeof(callback) === 'function') {
								Peerio.network.getAuthTokens(function(authTokens) {
									Peerio.crypto.decryptAuthTokens(authTokens)
									callback()
								})
							}
						})
					}
					else {
						Peerio.user.login(username, passOrPIN, true, callback)
					}
				})
			}
			else {
				Peerio.user.setKeyPair(passOrPIN, username, function() {
					Peerio.network.getAuthTokens(function(authTokens) {
						Peerio.crypto.decryptAuthTokens(authTokens)
						if (typeof(callback) === 'function') {
							Peerio.network.getAuthTokens(function(authTokens) {
								Peerio.crypto.decryptAuthTokens(authTokens)
								callback()
							})
						}
					})
				})
			}
		})
	}

	/**
	 * Returns an unused authToken from the Peerio.user.authTokens array
	 * and removes the token from the array (considering it to be now used).
	 * @return {string} authToken - authToken in Base64 format.
	 */
	Peerio.user.popAuthToken = function() {
		var authToken = Peerio.user.authTokens[0]
		Peerio.user.authTokens.splice(0, 1)
		return authToken
	}

	/**
	 * Given a string, figure out if it's a username or an address.
	 * If it's an address, then check if it belongs to a contact we can add.
	 * If it doesn't belong, send an invite to that contact.
	 * If it's just a username, then find out if the username exists and proceed.
	 * @param {string} input
	 * @param {function} callback
	 */
	Peerio.user.addContact = function(input, callback) {
		var parsed = Peerio.util.parseAddress(input)
		if (parsed) {
			Peerio.network.addContact([{address: parsed}], function(data) {
				if (hasProp(data, 'error')) {
					if (typeof(callback) === 'function') {
						callback({
							type: 'address',
							success: false
						})
					}
				}
				else if (typeof(callback) === 'function') {
					callback({
						type: 'address',
						success: true
					})
				}
			})
		}
		else if (typeof(input) === 'string') {
			if (input[0] === '@') {
				input = input.substr(1)
			}
			if (input.match(/^\w{1,16}$/)) {
				Peerio.network.addContact([{username: input}], function(data) {
					if (hasProp(data, 'error')) {
						if (typeof(callback) === 'function') {
							callback({
								type: 'username',
								success: false
							})
						}
					}
					else if (typeof(callback) === 'function') {
						callback({
							type: 'username',
							success: true
						})
					}
				})
			}
			else {
				if (typeof(callback) === 'function') {
					callback({
						type: 'username',
						success: false
					})
				}
			}
		}
	}

	/**
	 * Get all contacts and contact requests, organize them in an object, and return it.
	 * Also stores the result as Peerio.user.contacts, and does TOFU checks.
	 * @param {function} callback - returned with TOFU mismatch error if it exists, or false if there is no error.
	 * @param {function} onContact - called dynamically for every received contact.
	 */
	Peerio.user.getAllContacts = function(callback, onContact) {
		var contacts = {}
		contacts[Peerio.user.username] = {
			firstName: Peerio.user.firstName,
			lastName: Peerio.user.lastName,
			isNew: false,
			isRequest: false,
			isReceivedRequest: false,
			isMe: true,
			miniLockID: Peerio.user.miniLockID,
			username: Peerio.user.username,
			primaryAddress: Peerio.user.addresses[0] ? Peerio.user.addresses[0].value : '',
			addresses: []
		}
		Peerio.network.getContacts(function(result) {
			result.contacts.forEach(function(contact) {
				contact.isRequest = false
				contact.isReceivedRequest = false
				contact.isMe = false
				if (hasProp(contact, 'username')) {
					contacts[contact.username] = Object.create(null)
					for (var prop in contact) {
						if (hasProp(contact, prop)) {
							contacts[contact.username][prop] = contact[prop]
						}
					}
					if (typeof(onContact) === 'function') {
						onContact(contact)
					}
				}
			})
			Peerio.network.getSentContactRequests(function(result) {
				result.contactRequests.forEach(function(request) {
					var sentRequest = {
						firstName: '',
						isNew: false,
						lastName: '',
						miniLockID: '',
						primaryAddress: '',
						username: request,
						isRequest: true,
						isReceivedRequest: false,
						isMe: false
					}
					contacts[request] = sentRequest
				})
				Peerio.network.getReceivedContactRequests(function(result) {
					result.contactRequests.forEach(function(request) {
						request.isRequest = true
						request.isReceivedRequest = true
						request.isMe = false
						contacts[request.username] = request
					})
					Peerio.user.getTOFU(Peerio.user.username, function(isTOFU) {
						if (
							isTOFU &&
							(typeof(Peerio.user.TOFU) === 'object') &&
							Object.keys(Peerio.user.TOFU).length
						) {
							Peerio.user.contacts = contacts
							var compareTOFU = Peerio.util.compareTOFU(Peerio.user.TOFU)
							if (compareTOFU.notMatch.length) {
								Peerio.user.setTOFU(Peerio.util.getNewTOFU(), Peerio.user.username)
								if (typeof(callback) === 'function') {
									callback(compareTOFU)
								}
							}
							else if (compareTOFU.notFound.length) {
								Peerio.user.setTOFU(Peerio.util.getNewTOFU(), Peerio.user.username)
								if (typeof(callback) === 'function') {
									callback(false)
								}
							}
							else {
								console.log('TOFU check passed')
								if (typeof(callback) === 'function') {
									callback(false)
								}
							}
						}
						else if (!isTOFU) {
							Peerio.user.contacts = contacts
							Peerio.user.setTOFU(
								Peerio.util.getNewTOFU(),
								Peerio.user.username,
								function() {}
							)
							if (typeof(callback) === 'function') {
								callback(true)
							}
						}
						else {
							Peerio.user.contacts = contacts
							if (typeof(callback) === 'function') {
								callback(true)
							}
						}
					})
				})
			})
		})
	}

	/**
	 * Get contact requests and store them in Peerio.user.contacts.
	 * @param {function} callback
	 */
	Peerio.user.getReceivedContactRequests = function(callback) {
		Peerio.network.getReceivedContactRequests(function(result) {
			result.contactRequests.forEach(function(request) {
				request.isRequest = true
				request.isReceivedRequest = true
				request.isMe = false
				Peerio.user.contacts[request.username] = request
			})
			if (typeof(callback) === 'function') {
				callback()
			}
		})
	}

})()
