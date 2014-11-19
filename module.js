'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')

function Module(id, callback) {
    var self = this
    this.options = helper.extend({}, Module.data)

    this.id = this.handlePaths(id.replace('.js', ''))
    this.uri = cmd.iduri.normalize(path.join(this.options.base, cmd.iduri.appendext(this.id)))

    this.callbackList = [callback]
    this.result = null
    this.fetch()
}

helper.extend(Module.prototype, {
    callback: function() {
        var self = this
        self.callbackList.forEach(function(cb) {
            cb(self)
        })
        self.callbackList = []
        self.called = true
    },
    handlePaths: function(id) {
        var paths = this.options.paths
        Object.keys(paths).some(function(p) {
            if (id.indexOf(p) > -1) {
                id = id.replace(p, paths[p])
                return true
            }
        })
        return id
    },
    handleAlias: function(id) {
        var alias = this.options.alias[id]
        return alias || id
    },
    addCallback: function(callback) {
        if (this.called) {
            callback(this)
        } else {
            this.callbackList.push(callback)
        }
    },
    getFactory: function(callback) {
        var self = this
        var ext = path.extname(self.uri)
        var parser = self.options.parser[ext] || self.options.parser['.js']

        fs.exists(self.uri, function(exists) {
            self.exists = exists
            if (exists) {
                fs.readFile(self.uri, function(err, file) {
                    callback(parser(self, fs.readFileSync(self.uri).toString()))
                })
            } else {
                console.log('not found module: %s', self.id)
                callback(null)
            }
        })
    },
    fetch: function() {
        var self = this
        self.getFactory(function(factory) {
            if (factory !== null) {
                self.factory = factory
                self.save()
            } else {
                self.callback()
            }
        })
    },
    save: function() {
        var meta = cmd.ast.parseFirst(this.factory)

        // noncmd
        if (!meta) {
            this.result = this.factory
            this.callback()
        } else {
            // already concat
            if (meta.id) {
                this.id = meta.id
                this.result = this.factory
                this.callback()
            } else {
                this.deps = meta.dependencies
                this.load()
            }
        }
    },
    load: function() {
        var self = this
        var depFactories = []

        this.deps = helper.unique(this.deps)
        helper.asyncEach(this.deps, function(id, next) {
            if (id.charAt(0) !== '.' && !self.options.all) {
                return next()
            }
            id = cmd.iduri.absolute(self.id, id)
            Module.use(id, function(mod) {
                depFactories.push(mod)
                next()
            })
        }, function() {
            self.depFactories = depFactories
            self.concat()
        })
    },
    concat: function() {
        var asts = this.analyseDepFactories()
        var ast = this.analyseFactory()

        if (this.options.minify) {
            this.options.uglify.beautify = false
            ast = this.minify(ast)
        }

        this.result = ast.print_to_string(this.options.uglify) + '\n\n' + asts.print_to_string(this.options.uglify)
        this.callback()
    },
    analyseFactory: function() {
        var self = this
        var ast = UglifyJS.parse(this.factory)
        ast.figure_out_scope()

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
    analyseDepFactories: function() {
        var self = this
        var depFactories = self.depFactories.map(function(mod) {
            return mod.result
        })

        var ast = UglifyJS.parse(depFactories.join('\n'))

        var undefinedNode = new UglifyJS.AST_Atom()
        var duplicateCache = {}

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
                    return undefinedNode
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
    eachDefine: function(ast, fn) {
        ast.figure_out_scope()
        return ast.transform(new UglifyJS.TreeTransformer(function(node) {
            var exp = node.expression
            if (node instanceof UglifyJS.AST_Call && exp.name === 'define' && exp.thedef.global) {
                return fn(node)
            }
        }))
    }
})

var moduleCache = {}
helper.extend(Module, {
    moduleCache: moduleCache,
    data: {
        base: './',
        alias: {},
        paths: {},
        minify: true,
        all: true,
        uglify: {
            ascii_only: true,
            beautify: true
        },
        parser: {
            '.css': function(mod, file) {
                var tpl = [
                    'define("%s", [], function() {',
                    'seajs.importStyle(%s)',
                    '});'
                ].join('')
                return util.format(tpl, mod.id, JSON.stringify(file)) || null
            },
            '.js': function(mod, file) {
                return file
            }
        }
    },
    use: function(id, callback) {
        var mod = moduleCache[id]
        if (!mod) {
            moduleCache[id] = new Module(id, callback)
        } else {
            mod.addCallback(callback)
        }
    },
    config: function(options) {
        helper.extend(Module.data, options)
    }
})

module.exports = Module

function test() {
    Module.config({
        base: 'test/assets'
    })

    Module.use('amrio/tips/index', function(mod) {
        console.log(mod.result)
    })

    Module.use('amrio/tips/helper', function(mod) {
        console.log(1, mod.result)
    })

    Module.use('amrio/tips/helper', function(mod) {
        console.log(2, mod.result)
    })

    Module.use('amrio/tips/helper', function(mod) {
        console.log(3, mod.result)
    })

    setTimeout(function() {
        Module.use('amrio/tips/helper', function(mod) {
            console.log(4, mod.result)
        })
    }, 1000)
}
// test()
