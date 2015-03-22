'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')
var parsers = require('./parsers')

function Module(filepath, options) {
    this.src = self.normalizeUri(filepath)
    this.options = helper.extend({}, options)
    this.init()
}

helper.extend(Module.prototype, {
    init: function() {
        this.id = this.src.replace(/\.js$/, '')
        this.factory = this.getFactory()
        this.ast = UglifyJS.parse(this.factory)
        this.ast.figure_out_scope()
        this.deps = this.getDeps(this.ast)
    },
    normalizeUri: function(filepath) {
        return filepath.replace(/\\/g, '/')
    },
    getFactory: function() {
        var self = this
        this.uri = path.join(this.options.base, this.src)
        if (fs.extistsSync(this.uri)) {
            return fs.readFileSync(this.uri)
        }
        return null
    },
    getDeps: function(ast) {
        var self = this
        var depIds = []
        var deps = {}
        var baseDir = path.dirname(this.src)

        ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node.expression.thedef.global &&
                node instanceof UglifyJS.AST_Call &&
                node.expression.name === 'require' &&
                node.args.length === 1 &&
                node.args[0] instanceof UglifyJS.AST_String) {

                var id = node.args[0]
                if (id.charAt(0) === '.') {
                    depIds.push(path.join(baseDir, id))
                } else {
                    depIds.push(id)
                }
            }
        }))

        depIds.map(function(id) {
            var filepath = id
            var ext = path.extname(filepath)
            if (!parsers[ext]) {
                filepath += '.js'
            }
            var mod = Module.get(filepath, options)
            deps[mod.id] = mod
        })

        return deps
    },
    concat: function() {

    },
    transformDeps: function() {
        var self = this
        var depIds = Object.keys(this.deps)
        depIds.forEach(function(id) {
            self.deps[id]
            deps[id] = true
        })
    },
    transformFactory: function() {
        this.ast.transform(new UglifyJS.TreeTransformer(function(node) {
            var exp = node.expression
            if (node instanceof UglifyJS.AST_Call && exp.name === 'define' && exp.thedef.global && node.args.length === 1) {
                var args = []

                args.push(new UglifyJS.AST_String({
                    value: self.id
                }))

                args.push(new UglifyJS.AST_Array({
                    elements: self.deps.map(function(id) {
                        return new UglifyJS.AST_String({
                            value: id
                        })
                    })
                }))

                args.push(node.args[0])

                node.args = args
            }
        }))
    }
})

var cacheMods = {}
module.exports = function(filepath, options) {
    var uri = path.join(options.base, filepath)
    var mod = cacheMods[uri]
    if (!mod) {
        mod = new Module(filepath, options)
    }
    return mod
}
