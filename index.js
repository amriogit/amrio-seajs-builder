'use strict'

var fs = require('fs')
var path = require('path')
var util = require('util')

var glob = require('glob')
var mkdirp = require('mkdirp')
var chalk = require('chalk')
var _ = require('lodash')

var ModuleManager = require('./lib/module-manager')
var Module = require('./lib/module')
var cmdTools = require('./lib/cmd-tools')
var parsers = require('./lib/parsers')

function Builder(src, options) {

    if (!(this instanceof Builder)) {
        return new Builder(src, options)
    }

    this.options = _.merge({
        cwd: './',
        dest: './dist',
        encoding: 'utf-8',
        copyOther: true,
        onPost: writeFile,
        log: false
    }, options)

    this.src = [].concat(src)

    return this.init()
}

// Inner modules
_.assign(Builder, {
    parsers: parsers,
    ModuleManager: ModuleManager,
    Module: Module,
    cmdTools: cmdTools
})

_.assign(Builder.prototype, {
    init: function() {

        this.options.log && console.info(util.format('ASB Starting %s', chalk.cyan(this.src)))

        var self = this

        this.manager = new ModuleManager(this.options)

        this.manager.on('error', function(err) {
            self.options.log && console.error(err.stack || err)
        })

        this.manager.on('warn', function(msg) {
            self.options.log && console.warn(msg)
        })

        var filePaths = this.src.reduce(function(array, src) {
            return array.concat(glob.sync(src, {
                cwd: self.options.cwd,
                nodir: true
            }))
        }, [])

        return this.build(filePaths)
    },
    build: function(filePaths) {
        var self = this
        var options = this.options

        var startTime = +new Date()

        var promises = filePaths.map(function(filepath) {

            var ext = path.extname(filepath)
            var dest = cmdTools.join(options.dest, filepath)

            var id = cmdTools.clearId(filepath)
            var uri = cmdTools.join(self.options.cwd, filepath)
            
            dest = ext !== parsers.defaultExtname ? dest + parsers.defaultExtname : dest

            if (parsers.has(ext)) {
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

            var message = util.format('ASB Spend %s Builded %s Modules', chalk.cyan(spendTime), chalk.cyan(count))

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

module.exports = Builder
