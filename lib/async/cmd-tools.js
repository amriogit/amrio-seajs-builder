var path = require('path')

var UglifyJS = require('uglify-js')
var parsers = require('./parsers')

var cmdTools = {
    id2uri: function(id, base, cwd) {
        var isTop = id.match(/^\w/)
        var uri = path.resolve(cmdTools.addExtname(id, isTop ? base : cwd))
        return cmdTools.normalize(uri)
    },
    uri2id: function(uri, base) {
        uri = path.resolve(uri).replace(path.resolve(base), '').replace(/\.js$/, '').slice(1)
        return cmdTools.normalize(uri)
    },
    addExtname: function(uri, base) {
        var result = path.join(base, uri)
        var extname = path.extname(result)

        if (!extname && !parsers.has(extname)) {
            result += parsers.defaultExtname
        }

        return result
    },
    dirname: function(id) {
        return cmdTools.normalize(path.dirname(id))
    },
    join: function() {
        return cmdTools.normalize(path.join.apply(path, arguments))
    },
    normalize: function(uri) {
        return uri.replace(/\\/g, '/')
    },
    getAst: function(factory) {
        var ast = UglifyJS.parse(factory)
        ast.figure_out_scope()
        return ast
    },
    parse: function(ast) {
        var result = {
            cmd: false
        }

        ast.walk(new UglifyJS.TreeWalker(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global) {
                var meta = cmdTools.getMeta(node)
                result.cmd = true
                result.id = meta.id
                result.deps = meta.deps
            }
        }))

        return result
    },
    getMeta: function(node) {
        var meta = {
            deps: []
        }

        if (node.args.length === 1) {
            if (node.args[0] instanceof UglifyJS.AST_Function) {
                meta.deps = this.getRequires(node.args[0])

            }
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

        return meta
    },
    getRequires: function(factoryNode) {
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
    transport: function(ast, id, deps) {
        return ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.expression.thedef.global && node.args.length === 1) {
                var args = []
                var factory = node.args[0]

                args.push(new UglifyJS.AST_String({
                    value: id
                }))

                args.push(new UglifyJS.AST_Array({
                    elements: deps.map(function(id) {
                        return new UglifyJS.AST_String({
                            value: id
                        })
                    })
                }))

                args.push(factory)
                node.args = args

                return node
            }
        }))
    },
    minify: function(ast, options) {
        if (options.minify) {
            ast = ast.transform(UglifyJS.Compressor(options.uglify.compress))
            ast.figure_out_scope()
            ast.compute_char_frequency()
            ast.mangle_names()
        }
        return ast.print_to_string(options.uglify.beautify)
    }
}

module.exports = cmdTools
