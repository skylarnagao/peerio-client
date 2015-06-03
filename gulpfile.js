var gulp = require('gulp'),
	shell = require('gulp-shell'),
	replace = require('gulp-replace')
	rename = require('gulp-rename'),
	runSequence = require('run-sequence');

/**
 * Fetch json files from Transifex. 
**/
gulp.task('fetch-i18n', shell.task([
  		'tx pull -sf',
  		'tx pull -af'
	])
);

/**
 * Convert from json to l20n.
**/
gulp.task('convert-i18n', function() {
	return gulp.src('tmp/tx/*.json')
		.pipe(rename(function (path) {
		    path.extname = ".l20n"
  		}))
		.pipe(replace(/\{|\}/gi, ''))
		.pipe(replace(/"(\w+)": "(.*)",?\s?\n|\r/gi, '<$1 "$2">\n'))
    	.pipe(gulp.dest('src/chrome/locale'));
});

/**
 * Combines pulling and converting locale files. 
**/
gulp.task('localize', function(callback) {
	runSequence('fetch-i18n', 'convert-i18n', callback)
})