// Load plugins
var gulp = require('gulp'), 
	compass = require('gulp-compass');

var paths = {
	scss: ['sass/*.scss', 'sass/*/*.scss']
};

// Compass task
gulp.task('compass', function() {
	gulp.src('sass/*.scss')
	.pipe(compass({
		config_file: 'config.rb',
		css: 'css',
		sass: 'sass'
	})).pipe(gulp.dest('css'));
});

/* TO DO */
// Add CSS Minify
// Add JS Concat 
// Add JS Minify
// Order files to Concat + Minify
// 
// OR research Magento alternative

// Default task
gulp.task('default', function() {
	gulp.watch(paths.scss, ['compass']);
});