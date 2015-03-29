'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    glob = require('glob'),
    mkdirp = require('mkdirp'),
    chalk = require('chalk')

var helper = require('./lib/helper')
var ModuleManager = require('./lib/module-manager')
var parsers = require('./lib/parsers')

var defaults = {
    base: process.cwd(),
    dest: path.join(process.cwd(), 'sea-modules'),
    paths: [process.cwd()],
    exclude: [],
    parsers: parsers,
    all: false,
    minify: true,
    copyOther: true,
    footer: '\n',
    uglify: {
        ascii_only: true
    },
    log: true,
    onPost: writeFile
}

function Builder(src, options) {
    this.src = src
    this.options = helper.extend({}, defaults, options)
    helper.log(this.options.log, util.format('asb begin %s', chalk.cyan(this.src)))
    this.init()
}

helper.extend(Builder.prototype, {
    init: function() {
        this.moduleManager = new ModuleManager(this.options)
        var srcPaths = this.getSrcPaths()
        this.build(srcPaths)
    },
    getSrcPaths: function() {
        var options = this.options
        var pattern = glob.hasMagic(this.src) ? this.src : path.join(this.src, '**')

        if (glob.hasMagic(this.src)) {
            pattern = this.src
        } else {
            var uri = path.join(options.base, this.src)
            var isExists = fs.existsSync(uri)

            if (!isExists) {
                return []
            }

            var stat = fs.statSync(uri)
            if (stat.isFile() && path.extname(this.src) === '.js') {
                pattern = this.src
            } else if (stat.isDirectory()) {
                pattern = path.join(this.src, '**')
            } else {
                return []
            }
        }
        return glob.sync(pattern, {
            cwd: options.base,
            nodir: true
        })
    },
    build: function(srcPaths) {
        var self = this
        var options = this.options
        var dest = options.dest

        var startTime = +new Date()

        srcPaths.forEach(function(filepath) {
            var uri = path.resolve(self.options.base, filepath)
            var ext = path.extname(uri)
            var output = null

            if (ext === '.js') {
                var meta = {
                    id: helper.normalize(filepath.replace(/\.js$/, '')),
                    uri: helper.normalize(uri)
                }
                var mod = self.moduleManager.get(meta)
                output = mod.result

            } else if (options.copyOther) { 
                output = fs.readFileSync(uri)
            }

            if (output) {
                self.options.onPost(path.join(dest, filepath), output)
            }
        })

        var buildFileCount = Object.keys(this.moduleManager.cache).length
        var spendTime = (+new Date() - startTime) + 'ms'
        helper.log(self.options.log, util.format('asb spend %s build %s files\n', chalk.cyan(spendTime), chalk.cyan(buildFileCount)))
    }
})

function writeFile(filepath, file) {
    mkdirp.sync(path.dirname(filepath))
    fs.writeFileSync(filepath, file)
}

module.exports = function(src, options) {
    return new Builder(src, options)
}
