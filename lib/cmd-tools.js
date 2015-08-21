var path = require('path')

var UglifyJS = require('uglify-js')
var parsers = require('./parsers')
var H = require('./helper')

var defaultExtname = parsers.defaultExtname
var rDefaultExtname = new RegExp('\\' + parsers.defaultExtname + '$')

var cmdTools = {
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
    parseMeta: function(ast) {
        var meta = {}
        var found = false

        ast.walk(new UglifyJS.TreeWalker(function(node) {
            if (found) {
                return true
            }
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
                meta = cmdTools.extractMeta(node)
                return found = true
            }
        }))

        return meta
    },
    extractMeta: function(node) {
        var args = node.args

        var meta = {
            cmd: true,
            id: null,
            deps: []
        }

        // define(factory)
        if (args.length === 1) {
            if (args[0] instanceof UglifyJS.AST_Function) {
                meta.deps = this.collectRequires(args[0])
            }
        }

        // define(id || deps, factory)
        else if (args.length === 2) {

            // define(id, factory)
            if (args[0] instanceof UglifyJS.AST_String) {
                meta.id = args[0].getValue()

                if (args[1] instanceof UglifyJS.AST_Function) {
                    meta.deps = this.collectRequires(args[1])
                }
            }

            // define(deps, factory)
            else if (args[0] instanceof UglifyJS.AST_Array) {
                meta.deps = args[0].elements.map(function(id) {
                    if (id instanceof UglifyJS.AST_String) {
                        return id.getValue()
                    }
                })
            }

        }

        // define(id, deps, factory)
        else if (args.length === 3) {

            if (args[0] instanceof UglifyJS.AST_String) {
                meta.id = args[0].getValue()
            }

            else if (args[1] instanceof UglifyJS.AST_Array) {
                meta.deps = args[1].elements.map(function(id) {
                    if (id instanceof UglifyJS.AST_String) {
                        return id.getValue()
                    }
                })
            }
        }

        return meta
    },
    collectRequires: function(factoryAst) {
        var deps = []
        var dep = null

        function handle(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'require') {
                if (node.args && node.args.length === 1 && node.args[0] instanceof UglifyJS.AST_String) {
                    
                    dep = node.args[0]
                    dep = dep.getValue()

                    if (dep.length) {
                        deps.indexOf(dep) === -1 && deps.push(dep)
                    }
                }
            }
        }

        factoryAst.walk(new UglifyJS.TreeWalker(handle))

        return deps
    },
    transformRequires: function(ast, alias) {

        if (!Object.keys(alias).length) {
            return
        }

        function transform(node) {
            var arg = null
            var value = null
            var isArray = false
            var isString = false
            var isBreak = true

            if (node instanceof UglifyJS.AST_Call && node.args.length) {

                arg = node.args[0]

                isString = arg instanceof UglifyJS.AST_String
                isArray = arg instanceof UglifyJS.AST_Array

                isArray && (value = arg.elements)
                isString && (value = alias[arg.getValue()])

                if (value && value.length > 0) {
                    isBreak = false
                }
            }

            if (isBreak) {
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
            else if (node.start.value === 'require' && node.expression.property === 'async') {

                // require.async('id')
                if (isString) {
                    arg = new UglifyJS.AST_String({
                        value: value
                    })
                }

                // require.async([...])
                else if (isArray) {
                    arg = new UglifyJS.AST_Array({
                        elements: arg.elements.map(function(node) {
                            var id = node instanceof UglifyJS.AST_String && alias[node.getValue()]

                            if (id) {
                                return new UglifyJS.AST_String({
                                    value: id
                                })
                            }

                            return node
                        })
                    })
                }

            }

            if (arg) {
                node.args[0] = arg
            }
        }

        return ast.transform(new UglifyJS.TreeTransformer(transform))
    },
    transformCode: function(ast, options) {

        return ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global && node.args.length) {
                transform(node)
            }
        }))

        function transform(node) {
            var defineId = new UglifyJS.AST_String({
                value: options.id
            })

            var defineDeps = new UglifyJS.AST_Array({
                elements: options.deps.map(function(id) {
                    return new UglifyJS.AST_String({
                        value: id
                    })
                })
            })

            var defineFactory = null

            var args = node.args

            // define(id, deps, factory)
            if (args.length === 3) {
                return
            }

            // define(factory)
            if (args.length === 1) {
                defineFactory = args[0]

            } else if (args.length === 2) {

                // define(id, factory)
                if (args[0] instanceof UglifyJS.AST_String) {
                    defineId = args[0]

                } 

                // define(deps, factory)
                else if (args[0] instanceof UglifyJS.AST_Array) {
                    defineDeps = args[0]
                }

                defineFactory = args[1]
            }

            if (defineFactory instanceof UglifyJS.AST_Function) {
                cmdTools.transformRequires(defineFactory, options.alias)
            }

            node.args = [defineId, defineDeps, defineFactory]
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
