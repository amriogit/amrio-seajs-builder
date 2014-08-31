var grunt = require('grunt')

var cwd = process.cwd()
process.chdir(__dirname)
grunt.loadNpmTasks('grunt-contrib-clean')
grunt.loadNpmTasks('grunt-contrib-copy')
grunt.loadNpmTasks('grunt-contrib-uglify')
grunt.loadNpmTasks('grunt-contrib-cssmin')
grunt.loadNpmTasks('grunt-cmd-transport')
grunt.loadNpmTasks('grunt-cmd-concat')
process.chdir(cwd)

module.exports = {
    grunt: grunt,
    transport: require('./lib/transport')(grunt),
    concat: require('./lib/concat')(grunt),
    uglify: require('./lib/uglify')(grunt),
    clean: require('./lib/clean')(grunt),
    copy: require('./lib/copy')(grunt),
    cssmin: require('./lib/cssmin')(grunt)
}