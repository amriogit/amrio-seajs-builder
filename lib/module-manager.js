'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    chalk = require('chalk')

var UglifyJS = require('uglify-js')

var H = require('./helper')

function ModuleManager(options) {
    this.cache = {}
    this.options = options
}

H.extend(ModuleManager.prototype, {
    get: function(meta) {
        var mod = this.cache[meta.uri]
        if (!mod) {
            mod = this.cache[meta.uri] = new Module(meta, this)
        }
        return mod
    }
})

function Module(meta, manager) {
    this.meta = meta
    
    this.options = manager.options
    this.factory = null
    this.result = null
    this.remainDeps = []
    this.depsMods = []
    this.manager = manager

    this.fetch()
}

H.extend(Module.prototype, {
    getDepUri: function(dep) {
        var self = this
        var uri = null

        var paths = this.options.paths

        if (dep.isRelative) {
            paths = [H.normalize(path.dirname(this.meta.uri))]
        }

        paths.some(function(modulePath) {
            uri = H.ensureExtname(path.resolve(modulePath, dep.id), self.options.parsers)
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
            var isRelative = id.charAt(0) === '.'
            var absId = H.absId(id, self.meta.id)

            // 不允许循环引用
            if (absId === self.meta.id) {
                return
            }

            var exclude = false
            if (self.options.exclude) {
                if (H.isFunction(self.options.exclude)) {
                    exclude = self.options.exclude(absId, self.meta)

                } else if (H.isArray(self.options.exclude)) {
                    exclude = self.options.exclude.indexOf(absId) > -1
                }

                if (exclude === null) {
                    return
                }
            }

            if (exclude === true || (!isRelative && !self.options.all)) {
                remainDeps.push(absId)
                return
            }

            deps.push({
                id: id,
                absId: absId,
                isRelative: isRelative
            })
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
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
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

        if (this.meta.factory === undefined) {
            var ext = path.extname(this.meta.uri)
            var parser = this.options.parsers[ext]

            if (parser) {
                this.meta.factory = parser(this.meta)
            }
        }

        if (this.meta.factory === null) {
            H.log(this.options.log, util.format('not found mod %s', chalk.yellow(this.meta.uri)))
            return
        }

        var ast = UglifyJS.parse(this.meta.factory)
        ast.figure_out_scope()

        var meta = this.parseMeta(ast)

        // 目前只支持匿名模块，具名模块不会执行 transport concat
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

        deps.forEach(function(dep) {
            var id = dep.absId
            var uri = self.getDepUri(dep)

            var meta = {
                id: id,
                uri: uri
            }

            if (uri) {
                var mod = self.manager.get(meta)
                if (mod.factory) {
                    mods.push(mod)
                }
            } else {
                self.remainDeps.push(id)
                notFoundDeps.push(id)
            }
        })

        if (notFoundDeps.length) {
            H.log(this.options.log, util.format('module %s not found deps %s', chalk.cyan(this.meta.id), chalk.red('[' + notFoundDeps.join(', ') + ']')))
        }

        this.depsMods = mods
    },
    transport: function() {
        var self = this
        var ast = this.ast

        this.depsMods.forEach(function(mod) {
            self.remainDeps = self.remainDeps.concat(mod.remainDeps)
        })

        this.remainDeps = H.unique(this.remainDeps)

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

        function findDepsFactory(mods) {
            mods.forEach(function(mod) {
                if (!cache[mod.meta.id]) {

                    cache[mod.meta.id] = true
                    depsFactory.push(mod.factory)

                    if (mod.depsMods.length) {
                        findDepsFactory(mod.depsMods)
                    }
                }
            })
        }

        findDepsFactory(this.depsMods)

        this.result = [this.factory].concat(depsFactory).join(this.options.footer)
    }
})

module.exports = ModuleManager
