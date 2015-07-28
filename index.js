'use strict'

var fs = require('fs')
var path = require('path')
var util = require('util')
var glob = require('glob')
var mkdirp = require('mkdirp')
var chalk = require('chalk')

var ModuleManager = require('./lib/async/module-manager')
var Module = require('./lib/async/module')
var cmdTools = require('./lib/async/cmd-tools')
var parsers = require('./lib/async/parsers')

var H = require('./lib/helper')

function Builder(src, options) {

    this.options = H.extend({
        cwd: './',
        dest: './dist',
        encoding: 'utf-8',
        copyOther: true,
        log: function(info) {
            console.log(info.stack ? info.stack : info)
        }
    }, options)

    this.src = src

    H.log(this.options.log, util.format('asb begin %s', chalk.cyan(this.src)))

    return this.init()
}

H.extend(Builder.prototype, {
    init: function() {
        var self = this

        this.moduleManager = new ModuleManager(this.options)

        this.moduleManager.on('error', function(err) {
            H.log(self.options.log, err)
        })

        var pattern = this.src
        var ext = path.extname(pattern)

        if (!ext && !glob.hasMagic(pattern)) {
            pattern = path.join(pattern, '**')
        }

        var filePaths = glob.sync(pattern, {
            cwd: this.options.cwd,
            nodir: true
        })

        return this.build(filePaths)
    },
    build: function(filePaths) {
        var self = this
        var options = this.options

        var startTime = +new Date()

        var rExtname = new RegExp('\\' + parsers.defaultExtname + '$')

        var promises = filePaths.map(function(filepath) {

            var dest = cmdTools.normalize(path.join(options.dest, filepath))
            var uri = cmdTools.normalize(path.resolve(self.options.cwd, filepath))
            var ext = path.extname(uri)

            if (ext === parsers.defaultExtname) {
                var meta = {
                    uri: uri
                }

                return self.moduleManager.get(meta).then(function(module) {
                    self.output(dest, module.result)
                })

            } else if (options.copyOther) {
                return new Promise(function(resolve, reject) {
                    fs.readFile(uri, function(err, file) {
                        if (err) {
                            reject(err)
                        } else {
                            self.output(dest, file)
                            resolve()
                        }
                    })
                })
            }
        })

        return Promise.all(promises).then(function() {

            var count = Object.keys(self.moduleManager.cache).length
            var spendTime = (+new Date() - startTime) + 'ms'
            var message = util.format('asb spend %s build %s files\n', chalk.cyan(spendTime), chalk.cyan(count))

            H.log(self.options.log, message)
        })

    },
    output: function(dest, result) {
        mkdirp(path.dirname(dest), function(err) {
            if (err) {
                throw err
            } else {
                fs.writeFile(dest, result)
            }
        })
    }
})

function main(src, options) {
    return new Builder(src, options)
}

main.parsers = parsers
main.ModuleManager = ModuleManager
main.Module = Module
main.cmdTools = cmdTools
main.helper = H

module.exports = main
