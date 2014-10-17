module.exports = function(grunt) {
    return function(options) {
        grunt.initConfig({
            uglify: {
                uglify: {
                    options: {
                        mangle: options.mangle || {},
                        banner: options.banner || '',
                        ascii: options.ascii || true
                    },
                    files: [{
                        expand: true,
                        cwd: options.cwd || './',
                        src: options.src,
                        dest: options.dest
                    }]
                }
            }
        })

        grunt.task.run('uglify')
        grunt.task.start()
    }
}
