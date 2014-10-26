#!/usr/bin/env node

var path = require('path'),
    fs = require('fs'),
    util = require('util')
var asb = require('./')

function getAlias(alias) {
    var exists = fs.existsSync(alias)
    if (exists) {
        return JSON.parse(fs.readFileSync(alias).toString())
    } else {
        return {}
    }
}

function completeSrc(inputSrc) {
    return inputSrc.split(',').map(function(src) {
        return fs.statSync(src).isDirectory() ? path.join(src, '**/*.*') : src
    })
}

function getOptions() {
    var program = require('commander')
    var pkg = require('./package.json')
    program.version(pkg.version)
        .option('-s, --src <path>', 'src path required')
        .option('-d, --dest <path>', 'dest path [./sea-modules]', './sea-modules')
        .option('-i, --include <include>', 'concat include option [relative]', 'relative')
        .option('-p, --paths <path>', 'same node_modules [./sea-modules]', function(val) {
            if (val) {
                return val.split(',')
            } else {
                return ['./sea-modules']
            }
        })
        .option('-a, --alias <path>', 'alias config file path [./alias.json]', './alias.json')
        .option('--force', 'force')
        .option('--no-minify', 'disabled minify')
        .parse(process.argv)

    if (!program.src) {
        throw new Error('invalid --src args')
    }
    return program
}

function main() {
    var options = getOptions()
    options.alias = getAlias(options.alias)
    asb({
        src: options.src,
        dest: options.dest,
        paths: options.paths || [],
        all: options.include === 'all' ? true : false
    })
}

main()
