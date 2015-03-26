#!/usr/bin/env node

var path = require('path'),
    fs = require('fs'),
    util = require('util')
    chalk = require('chalk')

var asb = require('./')
var H = require('./lib/helper')

function resolve(uri) {
    return chalk.cyan(H.normalize(uri))
}

function getOptions() {
    var program = require('commander')
    var pkg = require('./package.json')
    program.version(pkg.version)
        .option('-s, --src <path>', 'src path required')
        .option('-d, --dest <path>', 'dest path [./sea-modules]', './sea-modules')
        .option('-p, --paths <path>', 'same node_modules [./, ./sea-modules]', function(val) {
            if (val) {
                return val.split(',')
            } else {
                return [resolve('sea-modules')]
            }
        })
        .option('--all', 'concat include all scope')
        .option('--no-minify', 'disabled minify')
        .parse(process.argv)

    if (!program.src) {
        throw new Error('invalid --src args')
    }
    return program
}

new function() {
    var options = getOptions()

    options.paths || (options.paths = ['./', 'sea-modules'])
    options.all || (options.all = false)
    console.log('build options:')
    console.log('src: %s', resolve(options.src))
    console.log('dest: %s', resolve(options.dest))
    console.log('paths: %s', resolve('[' + options.paths.join(', ') + ']'))
    console.log('all: %s', chalk.cyan(options.all))
    console.log('minify: %s\n', chalk.cyan(options.minify))

    asb(options.src, {
        dest: options.dest,
        paths: options.paths,
        all: options.all,
        minify: options.minify,
        log: true
    })
}
