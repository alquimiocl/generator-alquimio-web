'use strict';

var path = require('path');
var gulp = require('gulp');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var inject = require('gulp-inject');
var imagemin = require('gulp-imagemin');
var coffee = require('gulp-coffee');
var browserSync = require('browser-sync');
var uglify = require('gulp-uglify');
var uglifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var copy = require('gulp-copy');
var injectString = require('gulp-inject-string');
var nsp = require('gulp-nsp');
var karma = require('karma').Server;
var reload      = browserSync.reload;

// Settings File
var settings = require('./config.json');

var scripts = settings.assets.script;
var styles = settings.assets.style;
var mvAssets = settings.assets.mv;
var vendorScripts = settings.vendor.script;
var vendorStyles = settings.vendor.style;
var mvVendorAssets = settings.vendor.mv;
var ieScripts = settings.ie.script;
var ieStyles = settings.ie.style;
var mvIeAssets = settings.ie.mv;
var scriptToInject = [];
var stylesToInject = [];
var ieScriptToInject = [];
var ieStylesToInject = [];
var vendorScriptsToInject = [];
var vendorStylesToInject = [];
var mvFiles = [];
var index = 0;
for(index in scripts){
	scriptToInject.push("js/"+scripts[index]+".js");
}
for(index in styles){
	stylesToInject.push("css/"+styles[index]+".css");
}
for(index in vendorScripts){
	vendorScriptsToInject.push("vendor/"+vendorScripts[index]+".js");
}
for(index in vendorStyles){
	vendorStylesToInject.push("vendor/"+vendorStyles[index]+".css");
}
for(index in ieScripts){
	ieScriptToInject.push(ieScripts[index]+".js");
}
for(index in ieStyles){
	ieStylesToInject.push(ieStyles[index]+".css");
}
for(index in mvAssets){
	mvFiles.push(mvAssets[index]);
}
for(index in mvVendorAssets){
	mvFiles.push("vendor/"+mvVendorAssets[index]);
}
for(index in mvIeAssets){
	mvFiles.push("vendor/"+mvIeAssets[index]);
}

var server;

gulp.task('index', ['vendor', 'scripts', 'sass'], function() {
	var target = gulp.src('index.html', {cwd: 'src'});

	target
		.pipe(inject(
			gulp.src(
				scriptToInject,
				{read: false, cwd: 'app'}),
			{
				starttag: "<!-- SCRIPT -->",
				endtag: "<!-- END SCRIPT -->",
				addRootSlash: false,
				ignorePath: false,
				removeTags: settings.inject.removeTags,
				relative: false
			}))
		.pipe(inject(
			gulp.src(
				stylesToInject,
				{read: false, cwd: 'app'}),
			{
				starttag: "<!-- STYLES -->",
				endtag: "<!-- END STYLES -->",
				addRootSlash: false,
				ignorePath: false,
				removeTags: settings.inject.removeTags,
				relative: false
			}))
		.pipe(inject(
			gulp.src(
				vendorScriptsToInject,
				{read: false, cwd: 'app'}),
			{
				starttag: "<!-- VENDOR SCRIPT -->",
				endtag: "<!-- END VENDOR SCRIPT -->",
				addRootSlash: false,
				ignorePath: false,
				removeTags: settings.inject.removeTags,
				relative: false
			}))
		.pipe(inject(
			gulp.src(
				vendorStylesToInject,
				{read: false, cwd: 'app'}),
			{
				starttag: "<!-- VENDOR STYLES -->",
				endtag: "<!-- END VENDOR STYLES -->",
				addRootSlash: false,
				ignorePath: false,
				removeTags: settings.inject.removeTags,
				relative: false
			}))
		.pipe(inject(
			gulp.src(
				ieScriptToInject,
				{read: false, cwd: 'app'}),
			{
				starttag: "<!-- IE SCRIPT -->",
				endtag: "<!-- END IE SCRIPT -->",
				addRootSlash: false,
				ignorePath: false,
				removeTags: settings.inject.removeTags,
				relative: false
			}))
		.pipe(inject(
			gulp.src(
				ieStylesToInject,
				{read: false, cwd: 'app'}),
			{
				starttag: "<!-- IE STYLES -->",
				endtag: "<!-- END IE STYLES -->",
				addRootSlash: false,
				ignorePath: false,
				removeTags: settings.inject.removeTags,
				relative: false
			}))
		.pipe(injectString.after("<title>", settings.title || settings.name))
		.pipe(injectString.after("ng-app='", settings.angular.app))
		/* Creating File */
		.pipe(gulp.dest('.', {cwd: 'app'}));

	//gulp.src('./src/index.html')
	//		.pipe(gulp.dest('./app/'));
});

gulp.task('images', function () {

	return gulp.src('src/images/*')
			.pipe(imagemin({
				progressive: settings.image.progressive
			}))
			.pipe(gulp.dest('./app/images/'));
});

gulp.task('views', ["vendor", "index"], function() {

	return gulp.src(['templates/*.html', 'templates/**/*.html'], {cwd: 'src'})
		.pipe(copy('./app'));
});

gulp.task('vendor', ['script-vendor', 'css-vendor', 'script-ie', 'css-ie'], function(){
	return gulp.src(mvFiles, {cwd: 'src'}).pipe(copy('app/'));
});

gulp.task('script-vendor', function(){
	return gulp.src(vendorScriptsToInject, {cwd: 'src'}).pipe(copy('app/'));
});

gulp.task('css-vendor', function(){
	return gulp.src(vendorStylesToInject, {cwd: 'src'}).pipe(copy('app/'));
});

gulp.task('script-ie', function(){
	return gulp.src(ieScriptToInject, {cwd: 'src'}).pipe(copy('app/'));
});

gulp.task('css-ie', function(){
	return gulp.src(ieStylesToInject, {cwd: 'src'}).pipe(copy('app/'));
});

gulp.task('scripts', function(cb) {
	return gulp.src('./src/coffee/**/*.coffee')
		.pipe(coffee({bare: settings.coffee.bare}).on('error', function(err){
			console.error(gutil.colors.red(err));
			cb();
			return;
		}))
		.pipe(gulp.dest('./app/js/'))
		.pipe(uglify({mangle: settings.coffee.mangle}))
		.pipe(rename({extname: '.min.js'}))
		.pipe(gulp.dest('./app/js/'));
});

gulp.task('sass', function (cb) {
	return gulp.src('./src/scss/**/*.scss')
		.pipe(sass().on('error', function(err){
			console.error(gutil.colors.red(err));
			cb();
			return;
		}))
		.pipe(gulp.dest('./app/css/'))
		.pipe(uglifyCss({
			keepSpecialComments: 0
		}))
		.pipe(rename({
			suffix: '.min'
		}));
});

gulp.task('test', function (done) {
	new karma({
		configFile: __dirname + '/karma.conf.js',
		singleRun: false
	}, done).start();
});

gulp.task('main', ['images', 'views'], function(){

});

gulp.task('serve', ['main'], function() {
	if(server) {
		reload();
	}else {
		server = browserSync.create();
		server.init({
			server: "./app",
			files: ["app/**/*.css", "app/*.html", "app/templates/**/*.html", "app/templates/*.html", "app/**/*.js", "app/images/*", "app/vendor/**/*", "app/vendor/*"],
			port: settings.port,
			open: false
		});
	}

	gulp.watch("src/scss/**/*.scss", ['sass']);
	gulp.watch("src/scss/*.scss", ['sass']);
	gulp.watch("src/**/*.html", ['views']);
	gulp.watch("src/*.html", ['views']);
	gulp.watch("src/*.json", ['views']);
	gulp.watch("src/coffee/**/*.coffee", ['scripts']);
	gulp.watch("src/coffee/*.coffee", ['scripts']);
	gulp.watch("src/images/*", ['images']);
	gulp.watch("src/vendor/*", ['script-vendor', 'css-vendor']);
	gulp.watch("src/vendor/**/*", ['script-vendor', 'css-vendor']);

	gulp.watch("app/**/*.html").on('change', reload);
	gulp.watch("app/*.html").on('change', reload);
	gulp.watch("app/**/*.js").on('change', reload);
	gulp.watch("app/**/*.css").on('change', reload);
	gulp.watch("app/images/*").on('change', reload);
	gulp.watch("app/vendor/*").on('change', reload);
	gulp.watch("app/vendor/**/*").on('change', reload);
});

/* Yeoman Tasks */
gulp.task('nsp', function (cb) {
	nsp({package: path.resolve('package.json')}, cb);
});
gulp.task('prepublish', ['nsp']);
gulp.task('default', ['test', 'serve']);

