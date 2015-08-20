var path = require('path')

var UglifyJS = require('uglify-js')
var parsers = require('./parsers')
var H = require('./helper')

var defaultExtname = parsers.defaultExtname
var rDefaultExtname = new RegExp('\\' + parsers.defaultExtname + '$')

var cmdTools = {
    id2uri: function(id, base, cwd) {
        var isTopId = id.match(/^[^\.\\\/]/)
        var uri = path.join(isTopId ? base : cwd, id)

        uri = path.resolve(cmdTools.addExtname(uri))

        return cmdTools.normalize(uri)
    },
    addExtname: function(uri) {
        var extname = path.extname(uri)

        if (!extname && !parsers.has(extname)) {
            uri += parsers.defaultExtname
        }

        return uri
    },
    removeDefaultExtname: function(uri) {
        if (defaultExtname !== parsers.defaultExtname) {
            rDefaultExtname = new RegExp('\\' + parsers.defaultExtname + '$')
        }
        return uri.replace(rDefaultExtname, '')
    },
    clearId: function(id) {
        return cmdTools.normalize(cmdTools.removeDefaultExtname(id))
    },
    dirname: function(id) {
        return cmdTools.normalize(path.dirname(id))
    },
    join: function() {
        return cmdTools.normalize(path.join.apply(path, arguments))
    },
    normalize: function(uri) {
        return uri ? uri.replace(/\\+/g, '/') : uri
    },
    getAst: function(code) {
        var ast = UglifyJS.parse(code)
        ast.figure_out_scope()
        return ast
    },
    parse: function(ast) {
        var result = {}

        ast.walk(new UglifyJS.TreeWalker(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
                var meta = cmdTools.extractMeta(node)
                result.cmd = true
                result.id = meta.id
                result.deps = meta.deps
            }
        }))

        return result
    },
    extractMeta: function(node) {
        var meta = {
            id: null,
            deps: []
        }

        // define(factory)
        if (node.args.length === 1) {
            if (node.args[0] instanceof UglifyJS.AST_Function) {
                meta.deps = this.collectDepIds(node.args[0])
            }
        }

        // define(id || deps, factory)
        if (node.args.length === 2) {

            // define(id, factory)
            if (node.args[0] instanceof UglifyJS.AST_String) {
                meta.id = node.args[0].getValue()

                if (node.args[1] instanceof UglifyJS.AST_Function) {
                    meta.deps = this.collectDepIds(node.args[1])
                }
            }

            // define(deps, factory)
            if (node.args[0] instanceof UglifyJS.AST_Array) {
                meta.deps = node.args[0].elements.map(function(id) {
                    if (id instanceof UglifyJS.AST_String) {
                        return id.getValue()
                    }
                })
            }

        }

        // define(id, deps, factory)
        if (node.args.length === 3) {
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

        return meta
    },
    collectDepIds: function(factoryNode) {
        var deps = []

        factoryNode.walk(new UglifyJS.TreeWalker(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'require') {
                if (node.args && node.args.length === 1) {
                    var dep = node.args[0]
                    if (dep instanceof UglifyJS.AST_String) {
                        dep = dep.getValue()
                        deps.indexOf(dep) === -1 && deps.push(dep)
                    }
                }
            }
        }))

        return deps
    },
    transformRequires: function(ast, manager) {
        function transform(node) {
            var arg = null
            var value = null
            var isArray = false
            var isString = false
            var notTransform = true

            if (node instanceof UglifyJS.AST_Call && node.args.length) {

                arg = node.args[0]

                isString = arg instanceof UglifyJS.AST_String
                isArray = arg instanceof UglifyJS.AST_Array

                isArray && (value = arg.elements)
                isString && (value = manager.parseId(arg.getValue().trim()))

                if (!value) {
                    notTransform = true

                } else if (value && value.length === 0) {
                    notTransform = true

                } else {
                    notTransform = false
                }
            }

            if (notTransform) {
                return
            }

            // require('id')
            if (node.expression.name === 'require') {
                if (isString) {
                    arg = new UglifyJS.AST_String({
                        value: value
                    })
                }
            }

            // require.async(...)
            if (node.start.value === 'require' && node.expression.property === 'async') {

                // require.async('id')
                if (isString) {
                    arg = new UglifyJS.AST_String({
                        value: value
                    })
                }

                // require.async([...])
                if (isArray) {
                    arg = new UglifyJS.AST_Array({
                        elements: resolveIds(arg.elements)
                    })
                }

            }

            if (arg) {
                node.args[0] = arg
            }
        }

        function resolveIds(elements) {
            return elements.map(function(node) {
                var id = node instanceof UglifyJS.AST_String && node.getValue().trim()

                if (id) {
                    return new UglifyJS.AST_String({
                        value: manager.parseId(id)
                    })
                } else {
                    return node
                }

            })
        }

        return ast.transform(new UglifyJS.TreeTransformer(transform))
    },
    transformCode: function(ast, id, deps, manager) {
        return ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global && node.args.length) {
                transform(node)
            }
        }))

        function transform(node) {
            var defineId = new UglifyJS.AST_String({
                value: id
            })

            var defineDeps = new UglifyJS.AST_Array({
                elements: deps.map(function(id) {
                    return new UglifyJS.AST_String({
                        value: id
                    })
                })
            })

            var defineFactory = null

            var args = node.args
            var newArgs = []

            if (args.length === 3) {
                return
            }

            if (args.length === 1) {
                defineFactory = args[0]

            } else if (args.length === 2) {
                if (args[0] instanceof UglifyJS.AST_String) {
                    defineId = args[0]

                } else if (args[0] instanceof UglifyJS.AST_Array) {
                    defineDeps = args[0]
                }

                defineFactory = args[1]
            }

            newArgs.push(defineId)

            newArgs.push(defineDeps)

            if (defineFactory instanceof UglifyJS.AST_Function) {
                cmdTools.transformRequires(defineFactory, manager)
            }

            newArgs.push(defineFactory)

            node.args = newArgs
        }
    },
    minify: function(ast, isMinify, options) {
        options = H.extend({
            beautify: {
                beautify: true,
                ascii_only: false
            },
            compress: {}
        }, options)

        if (isMinify) {
            ast = ast.transform(UglifyJS.Compressor(options.compress))
            ast.figure_out_scope()
            ast.compute_char_frequency()
            ast.mangle_names()

            options.beautify.beautify = false
        } else {
            options.beautify.ascii_only && (options.beautify.ascii_only = false)
        }

        return ast.print_to_string(options.beautify)
    }
}

module.exports = cmdTools
