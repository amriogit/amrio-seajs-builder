module.exports = function(grunt) {
    return function(options) {

        grunt.initConfig({
            copy: {
                copy: {
                    files: [{
                        expand: true,
                        cwd: options.cwd,
                        src: options.src,
                        dest: options.dest
                    }]
                }
            }
        })

        grunt.option('force', true)
        grunt.registerTask('default', ['copy'])
        grunt.task.run('default')
        grunt.task.start()
    }
}
