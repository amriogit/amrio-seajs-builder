'use strict'

var fs = require('fs'),
    path = require('path'),
    util = require('util')

var glob = require('glob')
var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')
var mkdirp = require('mkdirp')

var helper = require('./lib/helper')
var Module = require('./lib/module')

function getMetas(id, base) {
    var metas = []

    metas = glob.sync(id, {
        cwd: base
    }).filter(function(id) {
        return fs.statSync(path.join(base, id)).isFile()
    }).map(function(id) {
        return {
            id: id.replace(/\.js$/, ''),
            originId: id,
            uri: path.join(base, id)
        }
    })
    return metas
}

function builder(input, options) {
    console.log('BUILDING: %s', helper.color(input))

    var options = helper.extend({}, builder.defaults, options)

    Module.config(options)

    var metas = getMetas(input, options.base)

    metas.forEach(function(meta) {
        var logText = 'BUILD TO %s OK.'
        var dest = path.join(options.base, options.dest, meta.originId)

        dest = cmd.iduri.appendext(dest)

        if (path.extname(meta.uri) === '.js') {
            var mod = Module.get(meta)

            if (mod.factory) {
                builder.saveFile(dest, mod.factory, logText)
            }
        } else if (!options.ignoreOthers) {
            var file = fs.readFileSync(meta.uri)

            if (file) {
                logText = 'COPY TO %s OK.'
                builder.saveFile(dest, file, logText)
            }
        }
    })
}

helper.extend(builder, {
    defaults: {
        base: './',
        dest: 'sea-modules'
    },
    UglifyJS: UglifyJS,
    Module: Module,
    saveFile: function(filepath, file, logText) {
        mkdirp.sync(path.dirname(filepath))
        fs.writeFileSync(filepath, file)
        if (!logText) {
            logText = 'SAVE %s OK.'
        }
        console.log(logText, helper.color(cmd.iduri.normalize(filepath)))
    }
})

module.exports = builder
