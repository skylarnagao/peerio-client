var gulp = require('gulp'),
	shell = require('gulp-shell'),
	replace = require('gulp-replace'),
	rename = require('gulp-rename'),
	runSequence = require('run-sequence'),
  del = require('del');

// settings
var tmpSources = 'tmp/tx/*.json';
var localeDest = 'src/chrome/locale';
var usedLangs = 'en,de,es,it,fr';

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