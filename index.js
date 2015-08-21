'use strict'

var fs = require('fs')
var path = require('path')
var util = require('util')

var glob = require('glob')
var mkdirp = require('mkdirp')
var chalk = require('chalk')

var ModuleManager = require('./lib/module-manager')
var Module = require('./lib/module')
var cmdTools = require('./lib/cmd-tools')
var parsers = require('./lib/parsers')

var H = require('./lib/helper')

function writeFile(dest, module, resolve, reject) {
    mkdirp(path.dirname(dest), function(err) {
        if (err) {
            reject(err)
        } else {
            fs.writeFile(dest, module.result, function(err) {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        }
    })
}

function Builder(src, options) {

    this.options = H.extend({
        cwd: './',
        dest: './dist',
        encoding: 'utf-8',
        copyOther: true,
        onPost: writeFile,
        log: false
    }, options)

    this.src = src

    return this.init()
}

H.extend(Builder.prototype, {
    init: function() {

        this.options.log && console.info(util.format('ASB Starting %s', chalk.cyan(this.src)))

        var self = this

        this.manager = new ModuleManager(this.options)

        this.manager.on('error', function(err) {
            self.options.log && console.error(err.stack)
        })

        this.manager.on('warn', function(msg) {
            self.options.log && console.warn(msg)
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

        var promises = filePaths.map(function(filepath) {

            var dest = cmdTools.join(options.dest, filepath)
            
            var id = cmdTools.clearId(filepath)
            var uri = cmdTools.join(self.options.cwd, filepath)

            var ext = path.extname(filepath)

            if (ext === parsers.defaultExtname) {
                var meta = {
                    id: id,
                    uri: uri
                }

                return self.manager.get(meta).then(function(module) {
                    return self.output(dest, module)
                })

            }

            if (options.copyOther) {
                return new Promise(function(resolve, reject) {
                    fs.readFile(uri, function(err, file) {
                        if (err) {
                            reject(err)
                        } else {
                            writeFile(dest, file, resolve, reject)
                        }
                    })
                })
            }
        })

        return Promise.all(promises).then(function() {

            var count = self.manager.count
            
            var spendTime = (+new Date() - startTime) + 'ms'

            var message = util.format('ASB Spend %s Builded %s Modules\n', chalk.cyan(spendTime), chalk.cyan(count))

            self.options.log && console.info(message)
        })

    },
    output: function(dest, module) {
        var self = this
        return new Promise(function(resolve, reject) {
            if (self.options.onPost) {
                self.options.onPost(dest, module, resolve, reject)
            } else {
                resolve()
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
