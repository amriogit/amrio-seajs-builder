module.exports = function(grunt) {
    return function(options) {
        
        grunt.initConfig({
            clean: {
                clean: {
                    src: options.src
                }
            }
        })

        grunt.registerTask('default', ['clean'])
        grunt.task.run('default')
        grunt.task.start()
    }
}
