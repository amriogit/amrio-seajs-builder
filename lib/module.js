'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    chalk = require('chalk')

var UglifyJS = require('uglify-js')

var helper = require('./helper')

function Module(meta, options) {
    this.meta = meta
    this.options = options
    this.factory = null
    this.result = null
    this.remainDeps = []
    this.depsMods = []

    this.fetch()
}

helper.extend(Module.prototype, {
    id2uri: function(id) {
        var self = this
        var uri = null
        self.options.paths.some(function(modulePath) {
            uri = helper.ensureExtname(path.join(modulePath, id), self.options.parsers)
            if (fs.existsSync(uri)) {
                return true
            } else {
                uri = null
            }
        })
        return uri
    },
    resolve: function() {
        var self = this
        var deps = []
        var remainDeps = this.remainDeps = []

        if (!this.meta.deps) {
            return deps
        }

        this.meta.deps.forEach(function(id) {
            var topId = helper.topId(id, self.meta.id)

            // 不允许循环引用
            if (topId === self.meta.id) {
                return
            }

            var exclude = false
            if (self.options.exclude) {
                if (helper.isFunction(self.options.exclude)) {
                    exclude = self.options.exclude(topId, self)

                } else if (helper.isArray(self.options.exclude)) {
                    exclude = self.options.exclude.indexOf(topId) > -1
                }

                if (exclude === null) {
                    return
                }
            }

            if (exclude === true || (id.charAt(0) !== '.' && !self.options.all)) {
                remainDeps.push(topId)
                return
            }

            deps.push(topId)
        })

        this.remainDeps = remainDeps
        return deps
    },
    parseMeta: function(ast) {
        var hasMeta = false
        var meta = {
            id: undefined,
            deps: []
        }

        ast.walk(new UglifyJS.TreeWalker(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define') {
                hasMeta = true
                getMeta(node)
                return true
            }
        }))

        function getMeta(node) {
            if (node.args.length === 1) {
                getRequires(node.args[0])

            } else if (node.args.length === 3) {
                if (node.args[0] instanceof UglifyJS.AST_String) {
                    meta.id = node.args[0].getValue()
                }

                if (node.args[1] instanceof UglifyJS.AST_Array) {
                    meta.deps = node.args[1].elements.map(function(id) {
                        if (id instanceof UglifyJS.AST_String) {
                            return id.getValue()
                        }
                    })
                }
            }
        }

        function getRequires(factory) {
            if (factory instanceof UglifyJS.AST_Function) {
                factory.walk(new UglifyJS.TreeWalker(function(node) {
                    if (node instanceof UglifyJS.AST_Call && node.expression.name === 'require') {
                        if (node.args && node.args.length === 1) {
                            var id = node.args[0]
                            if (id instanceof UglifyJS.AST_String) {
                                id = id.getValue()
                                meta.deps.indexOf(id) === -1 && meta.deps.push(id)
                            }
                        }
                    }
                }))
            }
        }

        return hasMeta && meta
    },
    minify: function(ast) {
        if (typeof ast === 'string') {
            ast = UglifyJS.parse(ast)
            ast.figure_out_scope()
        }

        if (this.options.minify) {
            ast = ast.transform(UglifyJS.Compressor({
                warnings: false
            }))
            ast.figure_out_scope()
            ast.compute_char_frequency()
            ast.mangle_names()
        }

        var uglifyOptions = this.options.minify ? this.options.uglify : {
            beautify: true
        }
        return ast.print_to_string(uglifyOptions)
    },
    fetch: function() {
        var ext = path.extname(this.meta.uri)
        var parser = this.options.parsers[ext]

        if (parser) {
            this.meta.factory = parser(this.meta)
        }

        if (this.meta.factory === null) {
            throw new Error(util.format('not found mod %s', chalk.yellow(this.meta.uri)))
            return null
        }

        var ast = UglifyJS.parse(this.meta.factory)
        ast.figure_out_scope()

        var meta = this.parseMeta(ast)

        // 目前只支持匿名模块，具名模块不会执行 transport concat
        // 非模块直接压缩
        if (meta && meta.id === undefined && meta.deps) {
            this.meta.deps = meta.deps
            this.ast = ast
            this.load()
            this.transport()
            this.concat()
        } else {
            this.result = this.factory = this.minify(ast)
        }
    },
    load: function() {
        var self = this
        var mods = []

        var deps = this.resolve()

        var notFoundDeps = []

        deps.forEach(function(id) {
            var meta = {
                id: id,
                uri: self.id2uri(id)
            }

            if (meta.uri) {
                var mod = Module.get(meta, self.options)
                if (mod.factory) {
                    mods.push(mod)
                }
            } else {
                self.remainDeps.push(id)
                notFoundDeps.push(id)
            }
        })

        if (notFoundDeps.length) {
            helper.log(self.options.log, util.format('module %s not found deps %s', chalk.cyan(this.meta.id), chalk.red('[' + notFoundDeps.join(', ') + ']')))
        }

        this.depsMods = mods
    },
    transport: function() {
        var self = this
        var ast = this.ast

        this.depsMods.forEach(function(mod) {
            self.remainDeps = self.remainDeps.concat(mod.remainDeps)
        })

        this.remainDeps = helper.unique(this.remainDeps)

        ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
                if (node.args.length === 1) {
                    return transport(node)
                }
            }
        }))

        function transport(node) {
            var args = []
            var factory = node.args[0]

            args.push(new UglifyJS.AST_String({
                value: self.meta.id
            }))

            args.push(new UglifyJS.AST_Array({
                elements: self.remainDeps.map(function(id) {
                    return new UglifyJS.AST_String({
                        value: id
                    })
                })
            }))

            args.push(factory)

            node.args = args
            return node
        }

        this.factory = this.minify(ast)
    },
    concat: function() {
        var cache = {}
        cache[this.meta.id] = true

        var depsFactory = []

        function recursiveFindDepsFactory(mods) {
            mods.forEach(function(mod) {
                if (!cache[mod.meta.id]) {

                    cache[mod.meta.id] = true
                    depsFactory.push(mod.factory)

                    if (mod.depsMods.length) {
                        recursiveFindDepsFactory(mod.depsMods)
                    }
                }
            })
        }

        recursiveFindDepsFactory(this.depsMods)

        this.result = [this.factory].concat(depsFactory).join(this.options.footer)
    }
})

helper.extend(Module, {
    cache: {},
    get: function(meta, options) {
        var mod = Module.cache[meta.uri]
        if (!mod) {
            mod = Module.cache[meta.uri] = new Module(meta, options)
        }
        return mod
    }
})

module.exports = Module
