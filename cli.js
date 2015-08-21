#!/usr/bin/env node

var path = require('path')
var fs = require('fs')
var util = require('util')
var chalk = require('chalk')

var asb = require('./')
var H = require('./lib/helper')

function resolve(uri) {
    return chalk.cyan(H.normalize(uri))
}

function objectOptions(values) {
    var result = {}

    if (values) {
        values = values.split(',')

        if (values.length) {
            values.forEach(function (value) {
                value = value.trim().split(':')
                result[value[0].trim()] = value[1].trim()
            })
        }
    }

    return result
}

function getOptions() {
    var program = require('commander')
    var pkg = require('./package.json')

    program.version(pkg.version)
        .option('-s, --src <value>', 'Src path required')
        .option('-d, --dest <value>', 'Dest path [dist]', 'dist')

        .option('--base <value>', 'Same seajs.config.base', '.')
        .option('--cwd <value>', 'Same seajs.config.cwd', '.')

        .option('--alias <value>', 'Same seajs.config.alias', objectOptions)
        .option('--paths <value>', 'Same seajs.config.paths', objectOptions)
        .option('--vars <value>', 'Same seajs.config.vars', objectOptions)

        .option('--all', 'Concat relative and top module')
        .option('--no-minify', 'Disabled minify module')
        .parse(process.argv)

    if (!program.src) {
        throw new Error('invalid --src args')
    }
    return program
}

new function() {
    var options = getOptions()

    console.log(options.alias)
    // options.paths || (options.paths = ['./', 'sea-modules'])
    // options.all || (options.all = false)
    // console.log('build options:')
    // console.log('src: %s', resolve(options.src))
    // console.log('dest: %s', resolve(options.dest))
    // console.log('paths: %s', resolve('[' + options.paths.join(', ') + ']'))
    // console.log('all: %s', chalk.cyan(options.all))
    // console.log('minify: %s\n', chalk.cyan(options.minify))

    // asb(options.src, {
    //     dest: options.dest,
    //     paths: options.paths,
    //     all: options.all,
    //     minify: options.minify,
    //     log: true
    // })
}
