'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')
var myUtil = require('./util')
var config = require('./config')

function parsePaths(id) {
    var paths = Module.data.paths
    Object.keys(paths).some(function(p) {
        if (id.indexOf(p) > -1) {
            id = id.replace(p, paths[p])
            return true
        }
    })
    return id
}

function Module(id) {
    this.id = id
    this.uri = myUtil.id2uri(id)
    this.ext = path.extname(this.uri)
    this.deps = []
}

helper.extend(Module.prototype, {
    fetch: function() {
        var parser = config.data.parser[this.ext]
        this.factory = parser(this)

        if (this.factory === null) {
            return
        }

        var meta = cmd.ast.parseFirst(this.factory)

        if (meta && !meta.id && meta.dependencies && meta.dependencies.length > 0) {
            this.deps = helper.unique(meta.dependencies)
            this.load()
        }
    },
    load: function() {
        var self = this
        var mods = []
        this.deps.forEach(function(id) {
            id = cmd.iduri.absolute(self.id, id)
            var mod = Module.get(id)
            mod && mods.push(mod)
        })
        this.analyseDepMods(mods)
    },
    analyseFactory: function() {
        var self = this
        var ast = UglifyJS.parse(self.factory)

        function anonymous(node) {
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

            return node
        }

        return self.eachDefine(ast, function(node) {
            if (node.args.length === 1) {
                return anonymous(node)
            }
            return node
        })
    },
    analyseDepMods: function(mods) {
        var self = this
        var depFactories = mods.map(function(mod) {
            return mod.factory
        })

        var ast = UglifyJS.parse(depFactories.join('\n'))

        var depRemains = {}
        self.deps.forEach(function(dep) {
            depRemains[cmd.iduri.absolute(self.id, dep)] = true
        })

        function uselessDeps(node) {
            if (node.args[1] instanceof UglifyJS.AST_Array) {
                var id = node.args[0].value
                node.args[1].elements.forEach(function(element) {
                    var dep = cmd.iduri.absolute(id, element.value)
                    depRemains[dep] = true
                })
                node.args[1].elements = []
            }
        }

        var duplicateCache = {}

        function duplicateDefine(node) {
            if (node.args[0] instanceof UglifyJS.AST_String) {
                var id = node.args[0].value
                delete depRemains[id]
                if (duplicateCache[id]) {
                    return true
                } else {
                    duplicateCache[id] = true
                }
            }
        }

        ast = self.eachDefine(ast, function(node) {
            if (node.args.length === 3) {
                if (duplicateDefine(node)) {
                    return new UglifyJS.AST_Atom()
                }
                uselessDeps(node)
                return node
            }
            return node
        })

        self.deps = Object.keys(depRemains)

        return ast
    },
    minify: function(ast) {
        ast = ast.transform(UglifyJS.Compressor({
            warnings: false
        }))
        ast.figure_out_scope()
        ast.compute_char_frequency()
        ast.mangle_names()
        return ast
    },
    eachDefine: function(ast, handler) {
        ast.figure_out_scope()
        return ast.transform(new UglifyJS.TreeTransformer(function(node) {
            var exp = node.expression
            if (node instanceof UglifyJS.AST_Call && exp.name === 'define' && exp.thedef.global) {
                return handler(node)
            }
        }))
    }
})
