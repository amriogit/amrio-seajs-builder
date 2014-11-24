'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')
var myUtil = require('./util')
var config = require('./config')

function Module(meta, options) {
    this.id = meta.id
    this.uri = meta.uri
    this.options = options
    this.deps = []
    this.depMods = []
    this.fetch()
}

helper.extend(Module, {
    cache: {},
    get: function(meta, options) {
        var mod = this.cache[meta.uri] || (this.cache[meta.uri] = new Module(meta, options))
        return mod
    }
})

helper.extend(Module.prototype, {
    fetch: function() {
        var parser = this.options.parser[cmd.iduri.extname(this.uri)]
        console.log(cmd.iduri.extname(this.uri))
        this.factory = parser(this)

        if (this.factory === null) {
            console.error('NOT FOUND MOD %s', this.id)
            return
        }

        var meta = cmd.ast.parseFirst(this.factory)

        if (meta && !meta.id && meta.dependencies && meta.dependencies.length > 0) {
            this.deps = helper.unique(meta.dependencies)
            this.load()
        } else {
            this.concat()
        }
    },
    load: function() {
        var self = this
        var mods = []

        this.deps.forEach(function(id, index) {

            // 配置了只合并相对标识
            if (id.charAt(0) !== '.' && !self.options.all) {
                return
            }

            var absId = cmd.iduri.absolute(self.id, id)
            if (self.options.exclude.indexOf(absId) > -1) {
                return
            }

            var meta = self.getMeta(absId)

            if (meta.uri) {
                var mod = Module.get(meta, self.options)
                mod.factory && mods.push(mod)
            } else {
                console.error('NOT FOUND DEP %s', meta.id)
            }

            self.deps[index] = meta.id
        })

        this.depMods = mods
        this.concat()
    },
    concat: function() {
        this.factory = [this.parseDepMods(), this.parseFactory()].reverse().join('\n')
    },
    getMeta: function(id) {
        var self = this
        var uri = null
        self.options.paths.some(function(p) {
            var filepath = path.join(self.options.base, p, id)
            filepath = cmd.iduri.appendext(filepath)
            var hasParser = self.options.parser[path.extname(filepath)]
            hasParser || (hasParser += '.js')
            if (fs.existsSync(filepath)) {
                uri = filepath
                return true
            }
        })
        return {
            id: id.replace('.js', ''),
            uri: uri
        }
    },
    eachDefine: function(ast, handler) {
        ast.figure_out_scope()
        return ast.transform(new UglifyJS.TreeTransformer(function(node) {
            var exp = node.expression
            if (node instanceof UglifyJS.AST_Call && exp.name === 'define' && exp.thedef.global) {
                return handler(node)
            }
        }))
    },
    parseFactory: function() {
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

        ast = self.eachDefine(ast, function(node) {
            if (node.args.length === 1) {
                return anonymous(node)
            }
            return node
        })

        if (self.options.minify) {
            ast = self.minify(ast)
        }

        return ast.print_to_string(self.options.uglify)
    },
    parseDepMods: function() {
        if (this.depMods.length === 0) {
            return ''
        }

        var self = this
        var depFactories = self.depMods.map(function(mod) {
            return mod.factory
        })

        return depFactories.join('\n')

        var ast = UglifyJS.parse(depFactories.join('\n'))

        var depRemains = {}
        self.deps.forEach(function(dep) {
            depRemains[dep] = true
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

        return ast.print_to_string(self.options.uglify)
    },
    minify: function(ast) {
        ast = ast.transform(UglifyJS.Compressor({
            warnings: false
        }))
        ast.figure_out_scope()
        ast.compute_char_frequency()
        ast.mangle_names()
        return ast
    }
})

module.exports = Module
