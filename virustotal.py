#!/usr/bin/python
# before running
# * have a virustotal api key
# * get in touch with virustotal support to be allowed in their 'bigfiles' api
# * pip install slackweb
# * export VIRUSTOTAL_API_KEY=yourapikey
import os
import re
import requests
import slackweb
import sys
import time
import urllib2

if len(sys.argv) < 2:
    sys.stderr.write("Usage: %s <file> \n" % (sys.argv[0]))
    sys.exit(1)

try:
    if not os.environ['VIRUSTOTAL_API_KEY']:
	print 'should not show up'
except Exception as e:
    sys.stderr.write('please define VIRUSTOTAL_API_KEY')
    sys.exit(2)

do_slack = False
try:
    if not os.environ['VIRUSTOTAL_SLACK_URL']:
	print 'should not either'
    do_slack = True
    slack = slackweb.Slack('https://hooks.slack.com/services/' + os.environ['VIRUSTOTAL_SLACK_URL'])
except Exception as e:
    print 'will not report to slack'

if not os.path.exists(sys.argv[1]):
    sys.stderr.write("ERROR: File %s was not found!\n" % sys.argv[1])
    sys.exit(1)
try:
    params = { 'apikey' : os.environ['VIRUSTOTAL_API_KEY'] }
    response = requests.get('https://www.virustotal.com/vtapi/v2/file/scan/upload_url', params=params)
    print 'fetching bigfile post URL (%d)' % response.status_code
    upload_url_json = response.json()
    upload_url = upload_url_json['upload_url']
    files = {'file': (sys.argv[1].decode('utf-8'), open(sys.argv[1], 'rb'))}
    response = requests.post(upload_url, files=files)
    print 'posted file to queue (%d)' % response.status_code
    check_url_json = response.json()
    check_url = check_url_json['permalink']
    result_matched = False
    while result_matched == False:
	try:
	    time.sleep(15)
	    req = urllib2.Request(check_url, headers={'User-Agent':'Mozilla/5.0'})
	    html = urllib2.urlopen(req).read()
	    match = re.search(r".*Detection ratio:</td>[^<]*<td[^>]*>[^0-9]*(\d+) / (\d+).*", html)
	    if match:
		status = 'WARNING'
		matched, seen = match.groups()
		result_matched = True
		if matched == '0':
		    status = 'OK'
		print '%s: %s/%s (full report: %s)' % (status, matched, seen, check_url)
		if do_slack == True:
		    text = status + ': ' + matched + '/' + seen + ' (full report: ' + check_url + ')'
		    slack.notify(text=text)
	    else:
		print 'still processing, sleeping (full report: %s)' % check_url
	except Exception as e:
	    print 'failed to track scan status'
	    print e
except Exception as e:
    print 'failed to submit'
    print e
