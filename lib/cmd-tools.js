var path = require('path')

var UglifyJS = require('uglify-js')
var parsers = require('./parsers')
var _ = require('lodash')

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
        var codeAst = UglifyJS.parse(code)
        codeAst.figure_out_scope()
        return codeAst
    },
    isValidDefineNode: function(node) {
        if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define') {
            if (node.expression.thedef.global && node.args.length > 0 && node.args.length <= 3) {
                return true
            } else {
                return false
            }
        } else {
            return null
        }
    },
    isMinified: function (factoryNode) {
        var argnames = factoryNode.argnames

        if (argnames.length > 0) {
            if (argnames[0].name === 'require') {
                return false
            } else {
                return true
            }
        } else {
            return false
        }
    },
    parseMeta: function(codeAst) {
        var meta = {}
        var found = false

        codeAst.walk(new UglifyJS.TreeWalker(function(node) {
            if (found) {
                return true
            }

            if (cmdTools.isValidDefineNode(node)) {
                meta = cmdTools.extractMeta(node)
                // Only parse first define meta
                return found = true
            }
        }))

        return meta
    },
    extractMeta: function(node) {

        var args = node.args

        var factory = null

        var meta = {
            untransform: true,
            minified: false,
            cmd: true,
            id: null,
            deps: []
        }

        // define(factory)
        if (args.length === 1) {
            if (args[0] instanceof UglifyJS.AST_Function) {
                factory = args[0]
            }
        }

        // define(id || deps, factory)
        else if (args.length === 2) {

            // define(id, factory)
            if (args[0] instanceof UglifyJS.AST_String) {
                meta.id = args[0].getValue()
            }

            // define(deps, factory)
            else if (args[0] instanceof UglifyJS.AST_Array) {
                meta.deps = args[0].elements.map(function(id) {
                    if (id instanceof UglifyJS.AST_String) {
                        return id.getValue()
                    } else {
                        return id
                    }
                })
            }

            if (args[1] instanceof UglifyJS.AST_Function) {
                factory = args[1]
            }
        }

        // define(id, deps, factory)
        else if (args.length === 3) {
            // Allready transformed, not transform again
            meta.untransform = false

        } else {
            // Not a cmd module
            meta.cmd = false
        }

        if (factory) {
            meta.minified = cmdTools.isMinified(factory)

            if (meta.minified === false) {
                meta.deps = this.collectDependencies(factory)
            }
        }

        return meta
    },
    collectDependencies: function(factoryAst) {
        var deps = []
        var dep = null

        function handle(node) {

            if (cmdTools.isValidDefineNode(node) === false) {
                // Don't collect invalid require
                return true
            }

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
    transformRequires: function(factoryAst, alias) {

        if (!Object.keys(alias).length) {
            return
        }

        function transform(node) {

            if (cmdTools.isValidDefineNode(node) === false) {
                // Don't transform invalid require
                return node
            }

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

        return factoryAst.transform(new UglifyJS.TreeTransformer(transform))
    },
    transformCode: function(codeAst, options) {
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

            } else if (args.length === 3) {
                if (args[2] instanceof uglify.AST_Function) {
                    defineFactory = args[2]
                }
            }

            if (defineFactory instanceof UglifyJS.AST_Function && !cmdTools.isMinified(defineFactory)) {
                cmdTools.transformRequires(defineFactory, options.alias)
            }

            node.args = [defineId, defineDeps, defineFactory]
        }

        return codeAst.transform(new UglifyJS.TreeTransformer(function(node) {

            if (cmdTools.isValidDefineNode(node)) {
                transform(node)

                // Don't transform define in define
                return node
            }
        }))
    },
    minify: function(codeAst, uglifyOptions) {
        codeAst = codeAst.transform(UglifyJS.Compressor(uglifyOptions.compress))
        codeAst.figure_out_scope()
        codeAst.compute_char_frequency()
        codeAst.mangle_names()
        return codeAst.print_to_string(uglifyOptions.beautify)
    },
    beautify: function (codeAst, isBeautify) {
        return codeAst.print_to_string({
            beautify: isBeautify ? true : false
        })
    }
}

module.exports = cmdTools
