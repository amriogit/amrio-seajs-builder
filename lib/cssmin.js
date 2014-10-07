module.exports = function(grunt) {
    return function(options) {
        
        grunt.initConfig({
            cssmin: {
                cssmin: {
                    files: [{
                        expand: true,
                        cwd: options.cwd,
                        src: options.src,
                        dest: options.dest
                    }]
                }
            }
        })

        grunt.registerTask('default', ['cssmin'])
        grunt.task.run('default')
        grunt.task.start()
    }
}
