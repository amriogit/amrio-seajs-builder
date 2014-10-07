var style = require('grunt-cmd-transport').style
module.exports = function(grunt) {
    return function(options) {
        var concatOptions = {
            options: {
                css2js: style.css2js,
                paths: options.paths,
                include: options.include
            },
            files: [{
                expand: true,
                cwd: options.cwd,
                src: options.src,
                dest: options.dest
            }]
        }

        grunt.initConfig({
            concat: {
                concat: concatOptions
            }
        })

        grunt.registerTask('default', ['concat'])
        grunt.task.run('default')
        grunt.task.start()
    }
}
