'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')

function Module(uri, options) {
    this.uri = uri
    this.result = null
    this.options = helper.extend({}, Module.defaults, options)
    this.fetch()
}

Module.prototype = {
    getFactory: function() {
        var ext = path.extname(this.uri)
        var parser = this.options.parser[ext] || this.options.parser['.js']

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

        this.deps = meta.dependencies
        this.load()
    },
    load: function() {
        var self = this
        var depFactories = []
        this.deps.forEach(function(uri) {
            if (!self.options.all && uri.charAt(0) !== '.') {
                return
            }
            uri = cmd.iduri.absolute(self.uri, uri)
            depFactories.push(Module.use(uri, self.options))
        })
        this.depFactories = depFactories
        this.concat()
    },
    concat: function() {
        var asts = this.parseDepFactories()
        var ast = this.parseFactory()

        if (this.options.minify) {
            ast = ast.transform(UglifyJS.Compressor({
                warnings: false
            }))
            ast.figure_out_scope()
            ast.compute_char_frequency()
            ast.mangle_names()
        }

        this.result = ast.print_to_string(this.options.uglify) + '\n\n' + asts.print_to_string(this.options.uglify)
    },
    parseDepFactories: function() {
        var self = this
        var depFactories = self.depFactories.map(function(mod) {
            return mod.result
        })

        var ast = UglifyJS.parse(depFactories.join('\n'))
        ast.figure_out_scope()

        var duplicateCache = {}
        var depRemains = {}
        var undefinedNode = new UglifyJS.AST_Atom()

        self.deps.forEach(function(dep) {
            depRemains[cmd.iduri.absolute(self.id, dep)] = true
        })

        function unnecessary(node) {
            if (node.args[1] instanceof UglifyJS.AST_Array) {
                var id = node.args[0].value
                node.args[1].elements.forEach(function(element) {
                    var dep = cmd.iduri.absolute(id, element.value)
                    depRemains[dep] = true
                })
                node.args[1].elements = []
            }
        }

        function duplicate(node) {
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

        ast = ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
                if (node.args.length === 3) {
                    if (duplicate(node)) {
                        return undefinedNode
                    }
                    unnecessary(node)
                    return node
                }
            }
        }))

        self.deps = Object.keys(depRemains)

        return ast
    },
    parseFactory: function() {
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
        }

        return ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
                if (node.args.length === 1) {
                    anonymous(node)
                    return node
                }
            }
        }))
    }
}

var moduleCache = {}

Module.use = function(uri, options) {
    uri = cmd.iduri.appendext(uri)
    if (!moduleCache[uri]) {
        moduleCache[uri] = new Module(uri, options)
    }
    return moduleCache[uri]
}

Module.moduleCache = moduleCache

Module.defaults = {
    minify: true,
    all: false,
    paths: ['sea-modules'],
    uglify: {
        ascii_only: true,
        beautify: true
    },
    parser: {
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
}

module.exports = Module

function test() {
    process.chdir('test/assets')
    var mod = Module.use('amrio/tips/index', {
        // minify: false
    })
    console.log(mod.result)
}
test()
