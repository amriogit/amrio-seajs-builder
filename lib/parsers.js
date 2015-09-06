var fs = require('fs')
var path = require('path')
var util = require('util')
var Promise = require('bluebird')
var cmdTools = require('./cmd-tools')

fs = Promise.promisifyAll(fs)

var cssTemplate = 'define("%s", [], function() { seajs.importStyle(%s); });'
var tplTemplate = 'define("%s", [], %s);'

var rWhiteSpace = /(\s|\\n|\\t|\\r)+/g
var paddingString = ' '

var parsers = {
    '.js': function(meta, resolve, reject) {
        Parser.readFile(meta.uri).then(resolve, reject)
    },
    '.css': function(meta, resolve, reject) {
        Parser.readFile(meta.uri).then(function(file) {
            file = file.replace(rWhiteSpace, paddingString)
            file = util.format(cssTemplate, meta.id, JSON.stringify(file))
            resolve(file)
        }).catch(reject)
    },
    '.tpl': function(meta, resolve, reject) {
        Parser.readFile(meta.uri).then(function(file) {
            file = file.replace(rWhiteSpace, paddingString)
            file = util.format(tplTemplate, meta.id, JSON.stringify(file))
            resolve(file)
        }).catch(reject)
    }
}

var Parser = {
    defaultExtname: '.js',
    parse: function(meta) {
        return new Promise(function(resolve, reject) {
            var ext = path.extname(meta.uri)
            if (parsers[ext]) {
                parsers[ext](meta, resolve, reject)
            } else {
                reject(new Error('Not found parser: ' + meta.uri))
            }
        })
    },
    has: function(ext) {
        return parsers[ext] ? true : false
    },
    add: function(ext, parser) {
        parsers[ext] = parser
    },
    readFile: function(uri, encoding) {
        encoding || (encoding = 'utf-8')
        return fs.readFileAsync(uri, {
            encoding: encoding
        }).then(function(file) {
            return file.toString(encoding)
        })
    }
}

module.exports = Parser
