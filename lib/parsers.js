var fs = require('fs'),
    path = require('path'),
    util = require('util')

var template = 'define("%s", [], function() { seajs.importStyle(%s); });'

module.exports = {
    '.js': function(meta) {
        var result = null
        if (fs.existsSync(meta.uri)) {
            result = fs.readFileSync(meta.uri).toString()
        }
        return result
    },
    '.css': function(meta) {
        var result = null
        if (fs.existsSync(meta.uri)) {
            var file = fs.readFileSync(meta.uri)
            result = util.format(template, meta.id, JSON.stringify(file.toString())) || null
        }
        return result
    },
    '.tpl': function(meta) {
        var result = null
        var uri = meta.uri + '.js'
        if (fs.existsSync(uri)) {
            result = fs.readFileSync(uri).toString()
        }
        return result
    }
}
