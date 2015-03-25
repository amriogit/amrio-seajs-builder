var fs = require('fs'),
    path = require('path'),
    util = require('util')

var CleanCSS = require('clean-css')

var cssTemplate = 'define("%s", [], function() { seajs.importStyle(%s); });'
var tplTemplate = 'define("%s", [], function() { return %s });'

module.exports = {
    '.js': function(meta) {
        var source = null
        if (fs.existsSync(meta.uri)) {
            source = fs.readFileSync(meta.uri).toString()
        }
        return source
    },
    '.css': function(meta) {
        var source = null
        if (fs.existsSync(meta.uri)) {
            var source = fs.readFileSync(meta.uri).toString()
            source = new CleanCSS().minify(source).styles
            source = util.format(cssTemplate, meta.id, JSON.stringify(source))
        }
        return source
    },
    '.tpl': function(meta) {
        var source = null
        if (fs.existsSync(meta.uri)) {
            source = fs.readFileSync(meta.uri).toString()
            source = util.format(tplTemplate, meta.id, JSON.stringify(source))
        }
        return source
    }
}