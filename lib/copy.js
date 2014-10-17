module.exports = function(grunt) {
    return function(options) {

        grunt.initConfig({
            copy: {
                copy: {
                    files: [{
                        expand: true,
                        cwd: options.cwd || './',
                        src: options.src,
                        dest: options.dest
                    }]
                }
            }
        })

        grunt.task.run('copy')
        grunt.task.start()
    }
}
