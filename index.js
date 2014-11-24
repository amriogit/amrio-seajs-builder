'use strict'

var fs = require('fs'),
    path = require('path'),
    util = require('util')

var glob = require('glob')
var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')
var mkdirp = require('mkdirp')

var helper = require('./helper')
var Module = require('./module')

var defaults = {
    all: false,
    minify: true,
    base: './',
    dest: 'sea-modules',
    paths: ['sea-modules', './'],
    parser: require('./parsers')
}

function getMetas(id, base) {
    var metas = []
    var uri = path.join(base, id)

    if (fs.statSync(uri).isFile()) {
        metas.push({
            id: id.replace('.js', ''),
            uri: uri
        })
    } else {
        metas = glob.sync(path.join(id, '**'), {
            cwd: base
        }).filter(function(id) {
            return fs.statSync(path.join(base, id)).isFile()
        }).map(function(id) {
            return {
                id: id.replace('.js', ''),
                uri: path.join(base, id)
            }
        })
    }
    return metas
}

function builder(input, options) {
    console.log('Building: %s', helper.color(input))

    var options = helper.extend({}, defaults, options)

    var metas = getMetas(input, options.base)

    metas.forEach(function(meta) {
        var logText = 'Build to %s ok.'
        var dest = path.join(options.base, options.dest, meta.id)
        dest = cmd.iduri.appendext(dest)

        if (path.extname(meta.uri) === '.js') {
            var mod = Module.get(meta, options)
            if (mod.factory) {
                builder.saveFile(dest, mod.factory, logText)
            }
        } else {
            fs.readFile(meta.uri, function(err, file) {
                if (file) {
                    logText = 'Copy to %s ok.'
                    builder.saveFile(dest, file, logText)
                }
            })
        }
    })
}

helper.extend(builder, {
    UglifyJS: UglifyJS,
    saveFile: function(filepath, file, logText) {
        mkdirp(path.dirname(filepath), function() {
            fs.writeFile(filepath, file)

            if (!logText) {
                logText = 'save %s ok.'
            }

            console.log(logText, helper.color(filepath))
        })
    }
})

module.exports = builder

// builder('amrio', {
//     base: 'test/assets'
// })

// builder('biz', {
//     base: 'test/assets'
// })
