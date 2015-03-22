'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    glob = require('glob'),
    mkdirp = require('mkdirp')

var helper = require('./helper')
var Module = require('./module')
var parsers = require('./parsers')

var defaults = {
    base: './',
    dest: './sea-modules',
    paths: ['./'],
    exclude: [],
    parsers: parsers,
    minify: true,
    uglify: {
        ascii_only: true
    },
    isConcatAll: false,
    footer: '\n',
    copyOther: false,

    onPost: writeFile,
    onResolve: null,
    onFetch: null,
    onLoad: null,
    onTransport: null,
    onConcat: null
}

function Builder(src, options) {
    this.src = src
    this.options = helper.extend({}, defaults, options)
    this.init()
}

helper.extend(Builder.prototype, {
    init: function() {
        var srcPaths = this.getSrcPaths()
        this.build(srcPaths)
    },
    getSrcPaths: function() {
        var options = this.options
        var pattern = glob.hasMagic(this.src) ? this.src : path.join(this.src, '**')
        return glob.sync(pattern, {
            cwd: options.base,
            nodir: true
        })
    },
    build: function(srcPaths) {
        var self = this
        var options = this.options
        var dest = options.dest

        srcPaths.forEach(function(filepath) {
            var uri = path.resolve(self.options.base, filepath)
            var ext = path.extname(uri)
            var output = null

            if (ext === '.js') {
                var meta = {
                    id: filepath.replace(/\.js$/, ''),
                    uri: uri
                }
                var mod = Module.get(meta, options)
                output = mod.result

            } else if (options.copyOther) {
                output = fs.readFileSync(uri)
            }

            if (output) {
                self.options.onPost(path.join(dest, filepath), output)
            }
        })
    }
})

function writeFile(filepath, file) {
    mkdirp.sync(path.dirname(filepath))
    fs.writeFileSync(filepath, file)
}

module.exports = function(src, options) {
    return new Builder(src, options)
}
