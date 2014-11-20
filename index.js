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

function color(text) {
    return util.inspect(text, {
        colors: true
    })
}

function builder(input, options, callback) {

    function getRealpath(uri) {
        return path.join(options.base, uri)
    }

    function handlePaths(id) {
        // var paths = options.paths
        // Object.keys(paths).some(function(p) {
        //     if (id.indexOf(p) > -1) {
        //         id = id.replace(p, paths[p])
        //         return true
        //     }
        // })
        return id
    }

    var defaults = {
        all: true,
        dest: 'sea-modules',
        minify: true
    }

    var options = helper.extend(defaults, options)
    Module.config(options)

    console.log('Starting build: %s', color(input))

    var parsePath = handlePaths(input)

    if (fs.statSync(getRealpath(parsePath)).isFile()) {
        handler(parsePath)
    } else {
        glob(path.join(parsePath, '**'), {
            cwd: options.base
        }, function(err, filespaths) {
            handler(filespaths)
        })
    }

    function handler(uris) {
        Array.isArray(uris) || (uris = [uris])
        uris.forEach(function(uri) {
            var realpath = getRealpath(uri)
            var logText = 'Build to %s ok.'

            if (!fs.statSync(realpath).isFile()) {
                return
            }

            if (path.extname(realpath) === '.js') {
                Module.use(uri, function(mod) {
                    if (mod.result) {
                        builder.saveFile(path.join(options.dest, uri), mod.result, logText)
                    }
                })
            } else {
                fs.readFile(realpath, function(err, file) {
                    if (file) {
                        logText = 'Copy to %s ok.'
                        builder.saveFile(path.join(options.dest, uri), file, logText)
                    }
                })
            }
        })
    }
}

helper.extend(builder, {
    Module: Module,
    UglifyJS: UglifyJS,
    saveFile: function(filepath, file, logText) {
        mkdirp(path.dirname(filepath), function() {
            fs.writeFile(filepath, file)
            console.log(logText, filepath)
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
