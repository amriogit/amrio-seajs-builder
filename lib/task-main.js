var path = require('path')

function loadGruntTask(grunt) {
    var cwd = process.cwd()
    process.chdir(path.join(__dirname, '../'))
    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-copy')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-cssmin')
    grunt.loadNpmTasks('grunt-cmd-transport')
    grunt.loadNpmTasks('grunt-cmd-concat')
    process.chdir(cwd)
}
module.exports = function(grunt, inPath, outPath, include) {
    var taskOptions = require('./task-options')(grunt, inPath, outPath, include)
    
    grunt.option('force', true)
    
    grunt.initConfig({
        clean: taskOptions.getCleanOptions(),
        copy: taskOptions.getCopyOptions(),
        transport: taskOptions.getTransportOptions(),
        concat: taskOptions.getConcatOptions(),
        uglify: taskOptions.getUglifyOptions(),
        cssmin: taskOptions.getCssMinOptions()
    })

    loadGruntTask(grunt)
    grunt.registerTask('default', ['clean', 'copy', 'transport', 'concat', 'uglify', 'cssmin'])
    grunt.task.run('default')
    grunt.task.start()
}