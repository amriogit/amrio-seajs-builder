'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')

function Module(meta) {
    this.id = meta.id
    this.uri = meta.uri
    this.deps = []
    this.depMods = []
    this.uglifyOptions = Module.data.minify ? Module.data.uglify : {
        beautify: true
    }
    this.fetch()
}

helper.extend(Module, {
    cache: {},
    defaults: {
        all: true,
        minify: true,
        base: './',
        dest: 'sea-modules',
        paths: ['sea-modules', './'],
        exclude: [],
        uglify: {
            ascii_only: true
        },
        parser: require('./parsers')
    },
    data: {},
    get: function(meta) {
        var mod = this.cache[meta.id] || (this.cache[meta.id] = new Module(meta))
        return mod
    }
})

helper.extend(Module.prototype, {
    fetch: function() {
        var parser = Module.data.parser[cmd.iduri.extname(this.uri)]
        this.factory = parser(this)

        if (this.factory === null) {
            throw new Error(util.format('NOT FOUND MOD %s', this.id))
            return
        }

        var meta = cmd.ast.parseFirst(this.factory)

        if (meta) {
            this.deps = helper.unique(meta.dependencies)
            this.load()
        } else {
            this.factory = this.minify(this.factory)
        }
    },
    load: function() {
        var self = this
        var mods = []

        this.deps.forEach(function(id, index) {

            // 配置了只合并相对标识
            if (id.charAt(0) !== '.' && !Module.data.all) {
                return
            }

            var absId = cmd.iduri.absolute(self.id, id)
            if (Module.data.exclude.indexOf(absId) > -1) {
                return
            }

            var meta = self.getMeta(absId)

            if (meta.uri) {
                var mod = Module.get(meta)
                if (mod.factory) {
                    mods.push(mod)
                    self.deps[index] = null
                }
            } else {
                console.error('NOT FOUND DEP %s', meta.id)
            }
        })

        this.depMods = mods
        this.factory = [this.parseDepMods(), this.parseFactory()].reverse().join(Module.data.minify ? '' : '\n\n')
    },
    getMeta: function(id) {
        var self = this
        var uri = null
        Module.data.paths.some(function(p) {
            var filepath = cmd.iduri.appendext(path.join(Module.data.base, p, id))
            Module.data.parser[path.extname(filepath)] || (filepath += '.js')

            if (fs.existsSync(filepath)) {
                uri = filepath
                return true
            }
        })
        return {
            id: id.replace(/\.js$/, ''),
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
    _anonymous: function(node) {
        var self = this
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
    },
    _uselessDeps: function(node, depRemains) {
        if (node.args[1] instanceof UglifyJS.AST_Array) {
            var id = node.args[0].value
            node.args[1].elements.forEach(function(element) {
                var dep = cmd.iduri.absolute(id, element.value)
                depRemains[dep] = true
            })
            node.args[1].elements = []
        }
        return node
    },
    _duplicateDefine: function(node, depRemains, duplicateCache) {
        if (node.args[0] instanceof UglifyJS.AST_String) {
            var id = node.args[0].value
            delete depRemains[id]
            if (duplicateCache[id]) {
                return true
            } else {
                duplicateCache[id] = true
            }
        }
    },
    parseFactory: function(noncmd) {
        var self = this
        var ast = UglifyJS.parse(self.factory)

        if (!noncmd) {
            ast = self.eachDefine(ast, function(node) {
                if (node.args.length === 1) {
                    return self._anonymous(node)
                }
                return node
            })
        } else {
            ast.figure_out_scope()
        }

        return this.minify(ast)
    },
    parseDepMods: function() {
        if (this.depMods.length === 0) {
            return ''
        }

        var self = this
        var depFactories = self.depMods.map(function(mod) {
            return mod.factory
        })

        var ast = UglifyJS.parse(depFactories.join('\n'))

        var duplicateCache = {}
        var depRemains = {}

        self.deps.forEach(function(dep) {
            dep && (depRemains[dep] = true)
        })

        ast = self.eachDefine(ast, function(node) {
            if (node.args.length === 3) {
                if (self._duplicateDefine(node, depRemains, duplicateCache)) {
                    return new UglifyJS.AST_Atom()
                }
                self._uselessDeps(node, depRemains)
                return node
            }
            return node
        })

        self.deps = Object.keys(depRemains)

        return ast.print_to_string(this.uglifyOptions)
    },
    minify: function(ast) {

        if (typeof ast === 'string') {
            ast = UglifyJS.parse(ast)
            ast.figure_out_scope()
        }

        if (Module.data.minify) {
            ast = ast.transform(UglifyJS.Compressor({
                warnings: false
            }))
            ast.figure_out_scope()
            ast.compute_char_frequency()
            ast.mangle_names()
        }

        return ast.print_to_string(this.uglifyOptions)
    }
})

module.exports = Module
