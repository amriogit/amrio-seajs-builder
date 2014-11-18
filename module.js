'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

function Module(uri, deps) {
    this.uri = uri
    this.deps = deps || []
    this.fetch()
}

Module.prototype = {
    getFactory: function() {
        var ext = path.extname(this.uri)
        var parser = Module.parser[ext] || Module.parser['.js']

        var uri = cmd.iduri.appendext(this.uri)
        if (fs.existsSync(uri)) {
            return parser(uri, fs.readFileSync(uri).toString())
        } else {
            return null
        }
    },
    fetch: function() {
        this.factory = this.getFactory()
        if (this.factory !== null) {
            this.save()
        }
    },
    save: function() {
        var meta = cmd.ast.parseFirst(this.factory)

        if (meta.id) {
            this.id = meta.id
        } else {
            this.id = this.uri.replace('.js', '')
        }

        this.deps = this.deps.concat(meta.dependencies)
        this.load()
    },
    load: function() {
        var self = this
        var deps = []
        this.deps.forEach(function(uri) {
            uri = cmd.iduri.absolute(self.uri, uri)
            deps.push(Module.getModule(uri))
        })
        this.depFactories = deps
    },
    concat: function() {
        var depFactories = this.depFactories.map(function(mod) {
            return mod.factory
        })

        depFactories.unshift(this.factory)
        this.ast = UglifyJS.parse(this.factory)
        this.depsAst = UglifyJS.parse(depFactories.join('\n'))

        return this.clean()
    },
    clean: function() {
        this.ast.print_to_string({
            beautify: true
        })
    },
    anonymousModule: function() {
        var ast = this.ast
        function anonymousModule(node) {
            node.args[2] = node.args[0]
            node.args[0] = new UglifyJS.AST_String({
                value: id
            })
            node.args[1] = new UglifyJS.AST_Array({
                elements: Object.keys(deps.remains).map(function(id) {
                    return new UglifyJS.AST_String({
                        value: id
                    })
                })
            })
        }

        ast = ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
                if (node.args.length === 1) {
                    anonymousModule(node)
                    return node
                }
            }
        }))

        this.ast = ast
    }
}

Module.moduleCache = {}
Module.getModule = function(uri) {
    if (Module.moduleCache[uri]) {
        return Module.moduleCache[uri]
    } else {
        return Module.moduleCache[uri] = new Module(uri)
    }
}

Module.parser = {
    '.css': function(uri, file) {
        var tpl = [
            'define("%s", [], function() { ',
            'seajs.importStyle(%s)',
            ' });'
        ].join('')
        file = util.format(tpl, uri, JSON.stringify(file))
        return file || null
    },
    '.js': function(uri, file) {
        return file
    }
}

module.exports = Module

function test() {
    process.chdir('test/assets')
    var mod = new Module('amrio/tips/index.js')
    console.log(mod.concat())
}
test()
