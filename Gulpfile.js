'use strict';

var path = require('path');
var gulp = require('gulp');
var jade = require('jade');
var gulpJade = require('gulp-jade');
var sass = require('gulp-sass');
var gutil = require('gulp-util');
var inject = require('gulp-inject');
var imagemin = require('gulp-imagemin');
var coffee = require('gulp-coffee');
var browserSync = require('browser-sync');
var express = require('express');
var argv = require('yargs').argv;
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
var templateEngine = settings.engine || "html";
var scriptEngine = settings.js || "coffee";
var scriptToInject = [];
var stylesToInject = [];
var ieScriptToInject = [];
var ieStylesToInject = [];
var vendorScriptsToInject = [];
var vendorStylesToInject = [];
var mvFiles = [];
var index = 0;
var extJS = ".js";
var extCSS = ".css";
var name = "";
for(index in scripts){
	if(scripts[index].indexOf(extJS) >= 0) name = scripts[index];
	else name = scripts[index]+extJS;
	scriptToInject.push("js/"+name);
}
for(index in styles){
	if(styles[index].indexOf(extCSS) >= 0) name = styles[index];
	else name = styles[index]+extCSS;
	stylesToInject.push("css/"+name);
}
for(index in vendorScripts){
	if(vendorScripts[index].indexOf(extJS) >= 0) name = vendorScripts[index];
	else name = vendorScripts[index]+extJS;
	vendorScriptsToInject.push("vendor/"+name);
}
for(index in vendorStyles){
	if(vendorStyles[index].indexOf(extCSS) >= 0) name = vendorStyles[index];
	else name = vendorStyles[index]+extCSS;
	vendorStylesToInject.push("vendor/"+name);
}
for(index in ieScripts){
	if(ieScripts[index].indexOf(extJS) >= 0) name = ieScripts[index];
	else name = ieScripts[index]+extJS;
	ieScriptToInject.push(name);
}
for(index in ieStyles){
	if(ieStyles[index].indexOf(extCSS) >= 0) name = ieStyles[index];
	else name = ieStyles[index]+extCSS;
	ieStylesToInject.push(name);
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
	var target = gulp.src('index.' + templateEngine, {cwd: 'src'});

	if(templateEngine == "jade"){
		target = target.pipe(gulpJade({
			jade: jade,
			pretty: true
		}));
	}

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
		.pipe(injectString.after("ng-app=\"", settings.angular.app))
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
	var resources = gulp.src(['templates/*.' + templateEngine, 'templates/**/*.' + templateEngine], {cwd: 'src'});
	if(templateEngine == "jade"){
		return resources
			.pipe(gulpJade({
				jade: jade,
				pretty: true
			}))
			.pipe(gulp.dest('./app/templates'))
	}else {
		return resources
			.pipe(copy('./app'));
	}
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
	if(scriptEngine == 'coffee') {
		return gulp.src('./src/scripts/**/*.coffee')
			.pipe(coffee({bare: settings.coffee.bare}).on('error', function (err) {
				console.error(gutil.colors.red(err));
				cb();
				return;
			}))
			.pipe(gulp.dest('./app/js/'))
			.pipe(uglify({mangle: settings.coffee.mangle}))
			.pipe(rename({extname: '.min.js'}))
			.pipe(gulp.dest('./app/js/'));
	}
	if(scriptEngine == 'javascript') {
		return gulp.src('./src/scripts/**/*.js')
			.pipe(gulp.dest('./app/js/'))
			.pipe(uglify({mangle: settings.coffee.mangle}))
			.pipe(rename({extname: '.min.js'}))
			.pipe(gulp.dest('./app/js/'));
	}
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
		}))
		.pipe(gulp.dest('./app/css/'));
});

gulp.task('test', function (done) {
	new karma({
		configFile: __dirname + '/karma.conf.js'
	}, done).start();
});

gulp.task('main', ['images', 'views'], function(){

});

gulp.task('serve', ['main'], function() {
	if(argv.production){
		var app = express();
		app.use(express.static('app'));
		app.listen(80);
	}else {
		if (server) {
			reload();
		} else {
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
		if(templateEngine == "html") {
			gulp.watch("src/**/*.html", ['views']);
			gulp.watch("src/*.html", ['views']);
		}
		if(templateEngine == "jade") {
			gulp.watch("src/**/*.jade", ['views']);
			gulp.watch("src/*.jade", ['views']);
		}
		gulp.watch("src/*.json", ['views']);
		if(scriptEngine == "coffee") {
			gulp.watch("src/scripts/**/*.coffee", ['scripts']);
			gulp.watch("src/scripts/*.coffee", ['scripts']);
		}
		if(scriptEngine == "javascript") {
			gulp.watch("src/scripts/**/*.js", ['scripts']);
			gulp.watch("src/scripts/*.js", ['scripts']);
		}
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
	}
});

/* Yeoman Tasks */
gulp.task('nsp', function (cb) {
	nsp({package: path.resolve('package.json')}, cb);
});
gulp.task('prepublish', ['nsp']);
gulp.task('default', ['test', 'serve']);