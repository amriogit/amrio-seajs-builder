var path = require('path'),
    fs = require('fs'),
    util = require('util')
var grunt = require('grunt')

// 切换工作目录，加载插件
var cwd = process.cwd()
process.chdir(__dirname)
grunt.loadNpmTasks('grunt-contrib-clean')
grunt.loadNpmTasks('grunt-contrib-copy')
grunt.loadNpmTasks('grunt-contrib-uglify')
grunt.loadNpmTasks('grunt-contrib-cssmin')
grunt.loadNpmTasks('grunt-cmd-transport')
grunt.loadNpmTasks('grunt-cmd-concat')
process.chdir(cwd)

var asb = {
    grunt: grunt,
    transport: require('./lib/transport')(grunt),
    concat: require('./lib/concat')(grunt),
    uglify: require('./lib/uglify')(grunt),
    clean: require('./lib/clean')(grunt),
    copy: require('./lib/copy')(grunt),
    cssmin: require('./lib/cssmin')(grunt),
    build: build
}

function build(opts) {

    var options = grunt.util._.extend({
        src: [],
        dest: 'sea-modules',
        include: 'relative',
        alias: {},
        paths: ['sea-modules'],
        tmp: '.tmp',
        minify: true,
        debug: false,
        clean: true,
        test: false
    }, opts)

    var dest = options.dest,
        transportDest = path.join(options.tmp, '.transport'),
        concatDest = path.join(options.tmp, '.concat')

    if (options.clean) {
        asb.clean({
            src: [options.tmp]
        })
    }

    var records = {}

    ![].concat(options.src).forEach(function(src) {
        var isDir = fs.statSync(src).isDirectory()
        var basedir = isDir ? src : path.dirname(src)

        if (!records[basedir]) {
            console.log('\nBuild %s', src)
            records[basedir] = true

            if(!options.test) {
                asb.copy({
                    src: isDir ? path.join(src, '**/*') : src,
                    dest: dest
                })
            }

            asb.transport({
                src: path.join(basedir, '**/*.*'),
                filter: 'isFile',
                dest: transportDest,
                paths: ['./', transportDest].concat(options.paths),
                alias: options.alias,
                debug: options.debug
            })
        }

        asb.concat({
            cwd: transportDest,
            src: isDir ? '**/*.{js,css}' : src,
            filter: 'isFile',
            dest: concatDest,
            include: options.include,
            paths: [transportDest].concat(options.paths)
        })
    })

    if (options.minify) {
        asb.uglify({
            cwd: concatDest,
            src: ['**/*.js', '!**/*{-debug,.tpl,.css}*'],
            dest: concatDest
        })
        asb.cssmin({
            cwd: concatDest,
            src: ['**/*.css', '!**/*-debug.css'],
            dest: concatDest
        })
    }

    if(!options.test) {
        asb.copy({
            cwd: concatDest,
            src: ['**/*.*'],
            dest: dest
        })
    }

    if (options.clean) {
        asb.clean({
            src: [options.tmp]
        })
    }

    console.log('\nBuild completed.')
}

module.exports = asb
