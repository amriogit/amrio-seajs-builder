#!/usr/bin/env node

var path = require('path'),
    fs = require('fs'),
    util = require('util')
var asb = require(resolve('./'))

function resolve(uri) {
    return path.join(__dirname, uri)
}

function getAlias(alias) {
    var exists = fs.existsSync(alias)
    if (exists) {
        return JSON.parse(fs.readFileSync(alias).toString())
    } else {
        return {}
    }
}

function getOptions() {
    var program = require('commander')
    var pkg = require(resolve('./package.json'))
    program.version(pkg.version)
        .option('-b, --build <path>', '构建路径', function(val) {
            return val.split(',')
        })
        .option('-d, --dist <path>', '部署路径', './sea-modules')
        .option('-i, --include <include>', '构建包含范围', 'relative')
        .option('-p, --paths <path>', 'paths 路径', function(val) {
            if(val) {
                return val.split(',')
            } else {
                return ['./sea-modules']
            }
        })
        .option('-a, --alias <path>', 'alias 别名文件路径', './package.json')
        .option('--force', '强制执行')
        .parse(process.argv)

    if (!program.build) {
        throw new Error('无效的 --build 参数，请指定需要构建的模块路径')
    }
    if (!program.dist) {
        throw new Error('无效的 --dist 参数，请指定构建模块后的部署路径')
    }
    return program
}

function start(options) {
    var dest = options.dist,
        transportDest = path.join(options.tmp, 'transport'),
        concatDest = path.join(options.tmp, 'concat')

    options.build.forEach(function(build) {

        var isDir = fs.statSync(build).isDirectory() 
        var dir = isDir ? build : path.dirname(build)

        asb.copy({
            cwd: './',
            src: isDir ? path.join(build, '**/*') : build,
            dest: dest
        })

        asb.transport({
            cwd: './',
            src: path.join(dir, '**/*.{js,css,tpl,html}'),
            dest: transportDest,
            paths: ['./'].concat(options.paths),
            alias: options.alias
        })

        asb.concat({
            cwd: transportDest,
            src: isDir ? ['**/*.js', '!**/*-debug.js'] : build,
            dest: concatDest,
            include: options.include,
            paths: [transportDest].concat(options.paths)
        })
    })

    asb.uglify({
        cwd: concatDest,
        src: '**/*.js',
        dest: concatDest,
        mangle: {},
        banner: ''
    })

    asb.copy({
        cwd: concatDest,
        src: ['**/*.*'],
        dest: dest
    })

    asb.clean({
        src: [options.tmp]
    })
}

function main() {
    var _ = asb.grunt.util._
    var options = _.extend({
        include: 'relative',
        paths: ['./sea-modules'],
        alias: null,
        tmp: './tmp',
        min: true
    }, getOptions())

    options.alias = getAlias(options.alias)
    asb.grunt.option('force', options.force)
    start(options)
}
main()