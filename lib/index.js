'use strict';

var path = require('path'),
    fs = require('fs'),
    util = require('util')
var grunt = require('grunt')

// 切换工作目录，加载插件
var cwd = process.cwd()
process.chdir(path.join(__dirname, '../'))
grunt.loadNpmTasks('grunt-contrib-clean')
grunt.loadNpmTasks('grunt-contrib-copy')
grunt.loadNpmTasks('grunt-contrib-uglify')
grunt.loadNpmTasks('grunt-contrib-cssmin')
grunt.loadNpmTasks('grunt-cmd-transport')
grunt.loadNpmTasks('grunt-cmd-concat')
process.chdir(cwd)

var asb = {
    grunt: grunt,
    transport: require('./transport')(grunt),
    concat: require('./concat')(grunt),
    uglify: require('./uglify')(grunt),
    clean: require('./clean')(grunt),
    copy: require('./copy')(grunt),
    cssmin: require('./cssmin')(grunt),
    build: build
}

function handleOptions(options) {
    options = grunt.util._.extend({
        include: 'relative',
        paths: ['./sea-modules'],
        alias: {},
        minify: true,
        tmp: './tmp',
        dest: './sea-modules'
    }, options)
    
    Array.isArray(options.src) || (options.src = [options.src])

    return options
}
function build(options) {

    options = handleOptions(options)

    var dest = options.dest,
        transportDest = path.join(options.tmp, 'transport'),
        concatDest = path.join(options.tmp, 'concat')

    options.src.forEach(function(src) {
        var isDir = fs.statSync(src).isDirectory() 
        var dir = isDir ? src : path.dirname(src)

        asb.copy({
            src: isDir ? path.join(src, '**/*') : src,
            dest: dest
        })

        asb.transport({
            src: path.join(dir, '**/*.{js,css,tpl,html}'),
            dest: transportDest,
            paths: ['./'].concat(options.paths),
            alias: options.alias
        })

        asb.concat({
            cwd: transportDest,
            src: isDir ? ['**/*.js', '!**/*{-debug*,.tpl,.html}.js'] : src,
            dest: concatDest,
            include: options.include,
            paths: [transportDest].concat(options.paths)
        })
    })

    if(options.minify) {
        asb.uglify({
            cwd: concatDest,
            src: ['**/*.js', '!**/*{-debug,.tpl,.css}.js'],
            dest: concatDest
        })
    }

    asb.copy({
        cwd: concatDest,
        src: ['**/*.*'],
        dest: dest
    })
    
    asb.clean({
        src: [options.tmp]
    })
}

module.exports = asb