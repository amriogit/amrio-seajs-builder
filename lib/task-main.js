function loadGruntTask(grunt) {
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-cssmin')
    grunt.loadNpmTasks('grunt-cmd-transport')
    grunt.loadNpmTasks('grunt-cmd-concat')
}
module.exports = function(grunt, inPath, outPath, include) {
    var taskOptions = require('./task-options')(grunt, inPath, outPath, include)
    grunt.initConfig({
        clear: taskOptions.getClearOptions(),
        copy: taskOptions.getCopyOptions(),
        transport: taskOptions.getTransportOptions(),
        concat: taskOptions.getConcatOptions(),
        uglify: taskOptions.getUglifyOptions(),
        cssmin: taskOptions.getCssMinOptions()
    })

    grunt.option('force', true)

    loadGruntTask(grunt)
    grunt.registerTask('default', ['clean', 'copy', 'transport', 'concat', 'uglify', 'cssmin', 'clean'])
    grunt.task.run('default')
    grunt.task.start()
}
