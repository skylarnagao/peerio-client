var apiKey = process.env.METASCAN_API_KEY || false,
    fs = require('fs'),
    http = require('https'),
    request = require('request'),
    slack = require('node-slackr');

if (! apiKey) { process.exit(1); }

request.post({
        url: 'https://scan.metascan-online.com/v2/file', 
        formData: { file: fs.createReadStream(__dirname + '/build/Peerio/win32/Peerio.exe') },
        headers: { apikey: apiKey }
    }, function(err, httpResponse, body) {
	if (err) { return console.error('upload failed:', err); }
	var parsed = JSON.parse(body),
	    host_array = parsed.rest_ip.split(':'),
	    host_name = host_array[0];
	var req = http.request({
		method: 'GET',
		hostname: host_name,
		path: '/v2/file/' + parsed.data_id,
		headers: { apikey: apiKey }
	    }, function(res) {
		var chunks = [];
		res.on('data', function(chunk) { chunks.push(chunk); });
		res.on('end', function() {
		    var output = JSON.parse(Buffer.concat(chunks).toString());
		    if (process.env.DEBUG) {
			console.log(JSON.stringify(output, null, 4));
		    } else {
			var notify = false;
			if (process.env.METASCAN_SLACK_URL) {
			    notify = new slack('https://hooks.slack.com/services/' + process.env.METASCAN_SLACK_URL);
			}
			Object.keys(output.scan_results.scan_details).forEach(function(key) {
				var obj = output.scan_results.scan_details[key];
				if (obj.scan_result_i != 0) {
				    console.log('scan returned ' + obj.scan_result_i + ' on ' + key);
				    if (notify !== false) {
					notify.notify('MetaScan reports error with ' + key + '(res: ' + obj.scan_result_i + ')');
				    }
				}
				if (obj.threat_found.length > 0) {
				    console.err('threats found on ' + key + ' (' + obj.threat_found + ')');
				    if (notify !== false) {
					notify.notify('MetaScan reports error with ' + key + '(threats: ' + obj.threat_found + ')');
				    }
// STFU				} else if (notify !== false) {
//				    notify.notify('MetaScan reports success against ' + key);
				}
			});
		    }
		});
	    });
	req.end();
    });
