'use strict'

var fs = require('fs'),
    path = require('path'),
    util = require('util')

var glob = require('glob')
var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')
var mkdirp = require('mkdirp')

function extend(dest, src) {
    Object.keys(src).map(function(k) {
        dest[k] = src[k]
    })
    return dest
}

function color(text) {
    return util.inspect(text, {
        colors: true
    })
}

var cache = {}

function builder(options) {
    return new Builder(options)
}
module.exports = builder

extend(builder, {
    cache: cache,
    UglifyJS: UglifyJS,
    saveFile: function(filepath, file) {
        mkdirp.sync(path.dirname(filepath))
        fs.writeFileSync(filepath, file)
    }
})


