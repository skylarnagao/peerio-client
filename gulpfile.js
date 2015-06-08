var gulp = require('gulp'),
	shell = require('gulp-shell'),
	replace = require('gulp-replace'),
	rename = require('gulp-rename'),
	runSequence = require('run-sequence'),
	_ = require('lodash'),
  del = require('del'), 
  NwBuilder = require('node-webkit-builder');
	


// settings
var tmpSources = 'tmp/tx/*.json';
var localeDest = 'src/chrome/locale';
var usedLangs = 'en,de,es,it,fr';


/**
 * Generate nwjs packages.
 */
var nw = new NwBuilder({
      files: 'src/chrome/**/**', // use the glob format
      platforms: ['win32', 'osx32', 'linux32'],
      buildDir: 'build', 
      macIcns: 'src/chrome/img/nw.icns', 
      macPlist: {
        'UTTypeReferenceURL': 'https://peerio.com',
        'CFBundleIdentifier': 'com.peerio.peeriomac',
        'DTSDKBuild': 10
      }, 
      winIco: 'src/chrome/img/icon256.ico'
  });


/**
 * Sign the executables.
 */
var codesignCommands = ['Contents/Frameworks/crash_inspector', 
              'Contents/Frameworks/nwjs\\ Framework.framework/nwjs\\ Framework',
              'Contents/Frameworks/nwjs\\ Helper\\ EH.app/',
              'Contents/Frameworks/nwjs\\ Helper\\ NP.app/',
              '/Contents/Frameworks/nwjs\\ Helper.app/Contents/MacOS/nwjs\\ Helper',
              'Contents/Frameworks/nwjs\\ Helper.app/',
              '']

codesignCommands = _.map(codesignCommands, function(file) {
  return 'codesign --force --verify --verbose --sign "' + process.env.PEERIO_DEVELOPER_ID + '" build/Peerio/osx32/Peerio.app/' + file;
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
 * Build the Mac, Windows, Linux packages.
 */  
gulp.task('build', function(callback) {
    nw.build()
    .then(function() {
      
      
    })
    .then(function() {
      callback();
    })
    .catch(function (error) {
        console.error(error);
        callback();
    });
});

/**
 * Sign the Mac package. 
 */   	
gulp.task('sign', shell.task(codesignCommands))

    
