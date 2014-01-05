module.exports = function(grunt) {

	grunt.initConfig({
	  pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				banner: '// <%= pkg.name %>.js <%= pkg.version %>\n// (c) 2012-2014 Greg MacWilliam\n// Freely distributed under the MIT license\n// Docs: github.com/gmac/micro-module-definition\n'
			},
			root: {
				src: '<%= pkg.name %>.js',
				dest: '<%= pkg.name %>.min.js',
				sourceMapUrl: '<%= pkg.name %>.min.map',
				sourceMapRoot: './'
			}
		}
	});
  
  grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['uglify']);
};