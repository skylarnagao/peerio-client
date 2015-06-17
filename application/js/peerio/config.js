// ---------------------
// Peerio.config
// ---------------------
//
// Peerio's config object contains client configuration.

Peerio.config = {};

(function() {
	'use strict';

	Peerio.config = {
		version: '1.1.0',
		buildID: 10,
		updateJSON: 'https://peerio.com/update/info.json',
		updateWin: 'https://peerio.com/download/peerio-win.msi',
		updateMac: 'https://peerio.com/download/peerio-mac.zip',
		minPINEntropy: 24,
		fileUploadSizeLimit: 419430400
	}

})()