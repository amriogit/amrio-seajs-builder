#!/usr/bin/env node
var fs = require('fs')

var _ = require('lodash')
var program = require('commander')
var pkg = require('./package.json')
var asb = require('./')

function objectCoercion(values) {
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

function arrayCoercion(values) {
    var result = []

    if (values) {
        values = values.split(',')
        if (values.length) {
            values.forEach(function (value) {
                value = value.trim()
                result.push(value)
            })
        }
    }

    return result
}


program.version(pkg.version)
    .usage('-s "amrio/**/*" -a $:jquery,_:underscore -p biz:./biz')

    .option('-s, --src <path>', 'src path required', arrayCoercion)
    .option('-d, --dest <path>', 'dest path. defaults ./dist', 'dist')

    .option('-c, --cwd <path>', 'same seajs.config.cwd. defaults ./', './')
    .option('-b, --base <path>', 'same seajs.config.base. defaults ./', './')

    .option('-a, --alias <object>', 'same seajs.config.alias', objectCoercion, {})
    .option('-p, --paths <object>', 'same seajs.config.paths', objectCoercion, {})
    .option('-v, --vars <object>', 'same seajs.config.vars', objectCoercion, {})
    .option('-e, --exclude <array>', 'exclude module', arrayCoercion, [])
    .option('--config <path>', 'specify a config file. defaults ./asb.config.js', './asb.config.js')

    .option('--all', 'concat relative and top')
    .option('--no-log', 'disable log')
    .option('--no-minify', 'disable minify')
    .option('--no-copy-other', 'copy other files, like *.{css,png,...}')
    .parse(process.argv)

var options = program.opts()

if (options.config && fs.existsSync(options.config)) {
    options = _.merge(require(options.config), options)
}

if (options.src) {
    asb(options.src, options)
} else {
    program.help()
}
