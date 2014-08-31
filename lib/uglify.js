module.exports = function(grunt) {
    return function(options) {
        grunt.initConfig({
            uglify: {
                uglify: {
                    options: {
                        mangle: options.mangle,
                        banner: options.banner
                    },
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
        grunt.registerTask('default', ['uglify'])
        grunt.task.run('default')
        grunt.task.start()
    }
}
