module.exports = function(grunt) {
    return function(options) {
        
        grunt.initConfig({
            cssmin: {
                cssmin: {
                    files: [{
                        expand: true,
                        cwd: options.cwd || './',
                        src: options.src,
                        dest: options.dest
                    }]
                }
            }
        })

        grunt.task.run('cssmin')
        grunt.task.start()
    }
}
