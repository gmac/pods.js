module.exports = function(grunt) {

	grunt.initConfig({
		min: {
			main: {
				src: 'mmd.js',
				dest: 'mmd.min.js'
			}
		}
	});

	grunt.registerTask('default', 'min');
};