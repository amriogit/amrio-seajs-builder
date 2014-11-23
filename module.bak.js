'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')

function Module(id, callback, uri) {
    var self = this
    this.options = helper.extend({}, Module.data)

    this.id = id
    this.uri = Module.id2uri(this.id)

    this.callbackList = [callback]
    this.result = null
    this.fetch()
}

helper.extend(Module.prototype, {
    callback: function() {
        var self = this
        self.callbackList.forEach(function(callback) {
            callback(self)
        })
        delete self.callbackList
    },
    addCallback: function(callback) {
        if (this.callbackList === undefined) {
            callback(this)
        } else {
            this.callbackList.push(callback)
        }
    },
    getFactory: function(callback) {
        var self = this
        var ext = path.extname(self.uri)
        var parser = self.options.parser[ext] || self.options.parser['.js']

        parser(self, function(result) {
            if (result === null) {
                console.log('Not found module: %s', self.id)
            }
            callback(result)
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
                this.deps = helper.unique(meta.dependencies)
                this.load()
            }
        }
    },
    load: function() {
        var self = this
        var depMods = []

        helper.asyncEach(self.deps, function(id, done) {
            if (id.charAt(0) !== '.' && !self.options.all) {
                return done()
            }
            var topID = cmd.iduri.absolute(self.id, id)
            topID = Module.parseID(topID)
            Module.use(topID, function(mod) {
                depMods.push(mod)
                done()
            })
        }, function() {
            self.depMods = depMods
            self.concat()
        })
    },
    concat: function() {
        var asts = this.analyseDepFactories()
        var ast = this.analyseFactory()

        if (this.options.minify) {
            this.options.uglify.beautify = false
            ast = this.minify(ast)
        } else {
            this.options.uglify.ascii_only = false
        }

        this.result = ast.print_to_string(this.options.uglify) + '\n' + asts.print_to_string(this.options.uglify)
        this.callback()
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
    analyseDepFactories: function() {
        var self = this
        var depFactories = self.depMods.map(function(mod) {
            return mod.result
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

var moduleCache = {}
helper.extend(Module, {
    cache: moduleCache,
    parsePaths: function(id) {
        var paths = Module.data.paths
        Object.keys(paths).some(function(p) {
            if (id.indexOf(p) > -1) {
                id = id.replace(p, paths[p])
                return true
            }
        })
        return id
    },
    parseAlias: function(id) {
        return Module.data.alias[id] || id
    },
    parseID: function(id) {
        id = id.replace('.js', '')
        id = Module.parseAlias(id)
        id = Module.parsePaths(id)
        return id
    },
    id2uri: function(id) {
        var uri = path.join(Module.data.base, cmd.iduri.appendext(id))
        return cmd.iduri.normalize(uri)
    },
    use: function(id, callback) {
        id = Module.parseID(id)
        var uri = Module.id2uri(id)
        var mod = moduleCache[uri]
        if (!mod) {
            moduleCache[uri] = new Module(id, callback)
        } else {
            mod.addCallback(callback)
        }
    },
    config: function(options) {
        helper.extend(Module.data, options)
    }
})

Module.data = {
    base: './',
    alias: {},
    paths: {},
    minify: true,
    all: true,
    data: {},
    uglify: {
        ascii_only: true,
        beautify: true
    }
}

Module.config({
    parser: {
        '.css': function(mod, callback) {
            fs.exists(mod.uri, function(exists) {
                if (exists) {
                    fs.readFile(mod.uri, function(err, file) {
                        if (err) throw err
                        var tpl = 'define("%s", [], function() { seajs.importStyle(%s); });'
                        var result = util.format(tpl, mod.id, JSON.stringify(file.toString())) || null
                        callback(result)
                    })
                } else {
                    callback(null)
                }
            })
        },
        '.js': function(mod, callback) {
            fs.exists(mod.uri, function(exists) {
                if (exists) {
                    fs.readFile(mod.uri, function(err, file) {
                        if (err) throw err
                        callback(file.toString())
                    })
                } else {
                    callback(null)
                }
            })
        },
        '.tpl': function(mod, callback) {
            var realuri = mod.uri + '.js'
            fs.exists(realuri, function(exists) {
                if (exists) {
                    fs.readFile(realuri, function(err, file) {
                        if (err) throw err
                        callback(file.toString())
                    })
                } else {
                    callback(null)
                }
            })
        }
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

    // Module.use('amrio/tips/helper', function(mod) {
    //     console.log(1, mod.result)
    // })

    // Module.use('amrio/tips/helper', function(mod) {
    //     console.log(2, mod.result)
    // })

    // Module.use('amrio/tips/helper', function(mod) {
    //     console.log(3, mod.result)
    // })

    // setTimeout(function() {
    //     Module.use('amrio/tips/helper', function(mod) {
    //         console.log(4, mod.result)
    //     })
    // }, 1000)
}

// test()
