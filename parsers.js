var fs = require('fs'),
    path = require('path'),
    util = require('util')

var template = 'define("%s", [], function() { seajs.importStyle(%s); });'

module.exports = {
    '.js': function(mod, callback) {
        var result = null
        if (fs.existsSync(mod.uri)) {
            result = fs.readFileSync(mod.uri).toString()
        }
        return result
    },
    '.css': function(mod, callback) {
        var result = null
        if (fs.existsSync(mod.uri)) {
            var file = fs.readFileSync(mod.uri)
            result = util.format(template, mod.id, JSON.stringify(file.toString())) || null
        }
        return result
    },
    '.tpl': function(mod, callback) {
        var result = null
        var uri = mod.uri + '.js'
        if (fs.existsSync(uri)) {
            result = fs.readFileSync(uri).toString()
        }
        return result
    }
}
