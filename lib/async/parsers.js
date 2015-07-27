var fs = require('fs')
var path = require('path')
var util = require('util')
var CleanCSS = require('clean-css')

var cmdTools = require('./cmd-tools')

var cssTemplate = 'define("%s", [], function() { seajs.importStyle(%s); });'
var tplTemplate = 'define("%s", [], function() { return %s });'

var parsers = {
    '.js': function(meta, resolve, reject) {
        fs.exists(meta.uri, function(exists) {
            if (exists) {
                fs.readFile(meta.uri, function(err, file) {
                    if (err) {
                        return reject(err)
                    }

                    resolve(file.toString('utf-8'))
                })
            } else {
                reject(new TypeError('Not found module: ' + meta.uri))
            }
        })
    },
    '.css': function(meta, resolve, reject) {
        fs.exists(meta.uri, function(exists) {
            if (exists) {
                fs.readFile(meta.uri, function(err, file) {
                    if (err) {
                        return reject(err)
                    }

                    file = file.toString('utf-8')
                    file = new CleanCSS().minify(file).styles
                    file = util.format(cssTemplate, meta.id, JSON.stringify(file))

                    resolve(file)
                })
            } else {
                reject(new TypeError('Not found module: ' + meta.uri))
            }
        })
    },
    '.tpl': function(meta, resolve, reject) {
        fs.exists(meta.uri, function(exists) {
            if (exists) {
                fs.readFile(meta.uri, function(err, file) {
                    if (err) {
                        return reject(err)
                    }

                    file = file.toString('utf-8')
                    file = util.format(tplTemplate, meta.id, JSON.stringify(file).replace(/(\s|\\n|\\t|\\r)+/g, ' '))

                    resolve(file)
                })
            } else {
                reject(new TypeError('Not found module: ' + meta.uri))
            }
        })
    }
}

module.exports = {
    defaultExtname: '.js',
    parse: function(meta) {
        return new Promise(function(resolve, reject) {
            var ext = path.extname(meta.uri)
            if (parsers[ext]) {
                parsers[ext](meta, resolve, reject)
            } else {
                reject(new TypeError('Not found parser: ' + meta.uri))
            }
        })
    },
    has: function(ext) {
        return parsers[ext] ? true : false
    },
    add: function(ext, parser) {
        parsers[ext] = parser
    }
}
