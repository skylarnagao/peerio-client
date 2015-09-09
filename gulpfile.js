var gulp = require('gulp'),
	shell = require('gulp-shell'),
	minimist = require('minimist'),
  	fs = require('fs'),
	replace = require('gulp-replace'),
	rename = require('gulp-rename'),
  	bump = require('gulp-bump'),
  	zip = require('gulp-zip'),
  	ignore = require('gulp-ignore'),
	runSequence = require('run-sequence'),
	_ = require('lodash'),
  	del = require('del'), 
  	NwBuilder = require('node-webkit-builder');
	

// settings
var tmpSources = 'tmp/tx/*.json';
var localeDest = 'application/locale';
var usedLangs = 'en,de,es,it,fr,ru,zh_CN,nb_NO,hu,tr,pt_BR,ja';
var buildDest = 'build/';
var codesignCommands = ['Contents/Frameworks/crash_inspector', 							// all executables must be signed
			  'Contents/Frameworks/nwjs\\ Framework.framework/nwjs\\ Framework',
			  'Contents/Frameworks/nwjs\\ Helper\\ EH.app/',
			  'Contents/Frameworks/nwjs\\ Helper\\ NP.app/',
			  '/Contents/Frameworks/nwjs\\ Helper.app/Contents/MacOS/nwjs\\ Helper',
			  'Contents/Frameworks/nwjs\\ Helper.app/',
			  '']

codesignCommands = _.map(codesignCommands, function(file) {
  return 'codesign --force --verify --verbose --sign "' + process.env.PEERIO_DEVELOPER_ID + '" '+ buildDest +'Peerio/osx32/Peerio.app/' + file;
});

/**
 * Fetch json files from Transifex.
**/
gulp.task('fetch-i18n-all', shell.task([
		'tx pull -sf',
		'tx pull -af'
	])
);

/**
 * Fetch only used locales json files from Transifex.
 **/
gulp.task('fetch-i18n-used', shell.task([
	'tx pull -f -l '+usedLangs
  ])
);

/**
 * Convert from json to l20n.
**/
gulp.task('convert-i18n', function() {
	return gulp.src(tmpSources)
		.pipe(rename(function (path) {
			path.basename = path.basename.replace('_', '-')
		}))
		.pipe(rename(function (path) {
			path.extname = ".l20n"
		}))
		.pipe(replace(/\{|\}/gi, ''))
		.pipe(replace(/"(\w+)": "(.*)",?\s?\n|\r/gi, '<$1 "$2">\n'))
		.pipe(gulp.dest(localeDest));
});

/**
 * Removes fetched sources
 */
gulp.task('clean-tmp', function(callback){
  del([tmpSources], callback);
});

/**
 * Combines pulling and converting locale files for currently used locales only.
 */
gulp.task('localize', function(callback) {
	runSequence('clean-tmp', 'fetch-i18n-used', 'convert-i18n', 'clean-tmp', callback);
});

/**
 * Combines pulling and converting locale files for all locales.
 */
gulp.task('localize:all', function(callback) {
  runSequence('clean-tmp', 'fetch-i18n-all', 'convert-i18n', 'clean-tmp', callback);
});

/**
 * Update dependencies in the source directory.
 **/
gulp.task('update-dependendencies', shell.task([
	'cd application/ && sudo npm update'
  ])
);

/**
 * Update dependencies and locales.
 **/
gulp.task('update', function(callback) {
  runSequence('localize', 'update-dependendencies')
});


/**
 * Increment build number.
 */
gulp.task('bump-build' ,function() {
  return gulp.src(['application/build.txt'])
  .pipe(replace(/([0-9]+)/g, function(match, number) {
	return +number +1;
  }))
  .pipe(gulp.dest('application/'))
});

/**
 * Generate application config.js file from version and build numbers found in build.txt and package.json. 
 */
gulp.task('bump-config', function(callback) {
	var buildNumber = fs.readFileSync("application/build.txt", "utf8"),
		version = JSON.parse(fs.readFileSync('application/package.json')).version;

	return gulp.src('application/js/peerio/config.js')
		.pipe(replace(/version: \'([0-9]|\.)+\',/gi, 'version: \'' + version + '\','))
		.pipe(replace(/buildID: ([0-9]+),/gi, 'buildID: ' + buildNumber + ','))
		.pipe(gulp.dest('application/js/peerio/'));
})

/**
 * Bump version in src
 */
gulp.task('bump-src', function(callback) {
	var type = minimist(process.argv)['type'] || 'patch';

	return gulp.src(['application/package.json', 'application/manifest.json'])
  			.pipe(bump({ type: type }))
  			.pipe(gulp.dest('application/'));
})

/**
 * Bump version in ./
 */
gulp.task('bump-main', function(callback) {
	var type = minimist(process.argv)['type'] || 'patch';	
	return gulp.src(['package.json'])
  			.pipe(bump({ type: type }))
  			.pipe(gulp.dest('./'));
})

/**
 * Bump version in all necessary files. Defaults to patch, can use flag --type minor|major when running through command line.
 **/
gulp.task('bump', function(callback) {
  	var type = minimist(process.argv)['type'] || 'patch';

	runSequence('bump-main', 'bump-src','bump-build', 'bump-config', callback) // generateConfig should always go last
})

/**
 * Zip the src directory, excluding node_modules.
 */  
gulp.task('build-chrome', function(callback) {
	return gulp.src('application/**')
			.pipe(ignore.exclude(/node_modules/))
			.pipe(zip('peerio-chrome.zip'))
			.pipe(gulp.dest(buildDest +'Peerio/chrome/'));
});


/**
 * Removes old builds
 */
gulp.task('clean-build', function(callback){
  del([buildDest + '*'], callback);
});

/**
 * Set permissions for Mac
 */
gulp.task('finalize-mac-build', shell.task(['chmod -R 755 '+ buildDest +'Peerio/osx32/Peerio.app/']))
// TODO zip

/**
 * Zip the src directory, excluding node_modules.
 */  
gulp.task('finalize-win-build', function(callback) {
	return gulp.src('application/img/notification.png')
			.pipe(gulp.dest(buildDest +'Peerio/win32/')); // TODO finalize linux build with this as well
});

// todo zip mac and windows binaries as well for Github & get md5 and sha1

/**
 * Build the Mac, Windows, Linux & Chrome packages.
 */  
gulp.task('build', function(callback) {

  var buildNumber = fs.readFileSync("application/build.txt", "utf8");

  /**
   * Generate nwjs packages.
   */
  var nw = new NwBuilder({
		files: 'application/**/**', // use the glob format
		platforms: ['win32', 'osx32', 'linux32'],
		buildDir: buildDest, 
		cacheDir: 'tmp/nw',
		macIcns: 'application/img/nw.icns', 
		macPlist: {
		  'UTTypeReferenceURL': 'https://peerio.com',
		  'CFBundleIdentifier': 'com.peerio.peeriomac',
		  'DTSDKBuild': buildNumber
		}, 
		winIco: 'application/img/icon256.ico'				// comment this line if you don't have wine installed
	});

  	runSequence('update-dependendencies', 'clean-build', function() {
  		nw.build()
  			.then(function() {
	  			runSequence('finalize-mac-build', 'build-chrome', 'finalize-win-build', callback)
			})
			.catch(function (error) {
				console.error(error);
				callback();
			});
  	})
});

/**
 * Sign the Mac package. 
 */   	
gulp.task('sign', shell.task(codesignCommands))


gulp.task('upload')

/*

scpClient.scp('local_folder', {
        "host": "remote_host",
        "port": "remote_port",
        "username": "username_on_remote",
        "path": "/path/on/remote",
        "agent": process.env["SSH_AUTH_SOCK"],
        "agentForward": true
    }, cb)

*/
	
