var path = require('path')
var child_process = require('child_process')
var cpus = require('os').cpus().length

var UglifyJS = require('uglify-js')
var parsers = require('./parsers')

var cid = 0

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
    _minify: function(ast) {
        ast = ast.transform(UglifyJS.Compressor({
            warnings: false
        }))
        ast.figure_out_scope()
        ast.compute_char_frequency()
        ast.mangle_names()

        return ast.print_to_string()
    },
    minify: function(ast, options) {
        return Promise.resolve(cmdTools._minify(ast))

        return new Promise(function(resolve, reject) {

            var factory = ast.print_to_string()

            cache[++cid] = resolve

            var whichWorker = cid % 10

            if (whichWorker <= 3) {
                worker.send({
                    cid: cid,
                    factory: factory
                })
            } else if (whichWorker <= 6) {
                worker2.send({
                    cid: cid,
                    factory: factory
                })
            } else if (whichWorker <= 9) {
                worker3.send({
                    cid: cid,
                    factory: factory
                })
            } else {
                worker.send({
                    cid: cid,
                    factory: factory
                })
            }
        })
    },
    killMinifyWorkers: function() {
        worker.kill()
        worker2.kill()
    }
}

// var cache = {}

// var worker = child_process.fork(__dirname + '/minify-worker.js')
// var worker2 = child_process.fork(__dirname + '/minify-worker.js')
// var worker3 = child_process.fork(__dirname + '/minify-worker.js')

// worker.on('message', function(data) {
//     cache[data.cid](data.factory)
// })

// worker2.on('message', function(data) {
//     cache[data.cid](data.factory)
// })

// worker3.on('message', function(data) {
//     cache[data.cid](data.factory)
// })

module.exports = cmdTools
