var apiKey = process.env.VIRUSTOTAL_API_KEY || false,
    notify = false,
    slack = require('node-slackr');
    virusTotal = require('virustotal.js');

if (! apiKey) { process.exit(1); }

if (process.env.VIRUSTOTAL_SLACK_URL) {
    notify = new slack('https://hooks.slack.com/services/' + process.env.VIRUSTOTAL_SLACK_URL);
}
virusTotal.setKey(apiKey);
virusTotal.scanFile(__dirname + '/build/Peerio/win32/Peerio.exe', function(err, res) {
	if (err) {
	    console.error(err);
	    if (notify !== false) {
		notify.notify('VirusTotal error processing Peerio.exe: ' + err);
	    }
	} else {
	    console.log(res);
	    if (notify !== false) {
		notify.notify('VirusTotal success processing Peerio.exe: ' + res);
	    }
	}
});
