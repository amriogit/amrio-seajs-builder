'use strict'

var fs = require('fs'),
    path = require('path'),
    util = require('util')

var glob = require('glob')
var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')
var mkdirp = require('mkdirp')

function extend(dest, src) {
    Object.keys(src).map(function(k) {
        dest[k] = src[k]
    })
    return dest
}

function color(text) {
    return util.inspect(text, {
        colors: true
    })
}

var cache = {}
Builder.cache = cache

function Builder(options) {
    var defaults = {
        all: false,
        paths: ['sea-modules'],
        dest: 'sea-modules',
        minify: true
    }
    this.options = extend(defaults, options)
    this.start()
}

extend(Builder.prototype, {
    moduleCache: function(id, module) {
        if (module !== undefined) {
            cache[id] = module
            return module
        } else {
            module = cache[id]
            module && console.log('Hit %s', id)
            return module
        }
    },
    start: function() {
        console.log('Starting...')
        var self = this
        var filespath = []
        if (fs.statSync(self.options.src).isFile()) {
            filespath = filespath.concat(self.options.src)
        } else {
            filespath = glob.sync(path.join(self.options.src, '**/*.{js,css}'))
        }
        filespath.forEach(function(uri) {
            var module = null
            if (path.extname(uri) === '.css') {
                module = fs.readFileSync(uri)
            } else {
                module = self.concatModule(uri)
            }

            if (module) {
                self.saveFile(uri, module)
            }
        })
    },
    concatModule: function(uri, modulePaths) {
        var module = this.getModule(uri, modulePaths)

        if (!module) {
            return module
        }

        var ast = cmd.ast.getAst(module)
        var meta = cmd.ast.parseFirst(ast)

        if (!meta) {
            return
        }

        if (meta.id) {
            return module
        }

        meta.id = uri.replace(/\.js$/, '')
        var deps = this.resolveDependencies(meta)

        module += ';' + Object.keys(deps.files).map(function(id) {
            return deps.files[id]
        }).join('')

        return this.cleanModule(meta.id, deps.remains, module)
    },
    cleanModule: function(id, remains, module) {
        var ast = cmd.ast.getAst(module)

        function anonymousModule(node) {
            if (node.args.length === 1) {
                node.args[2] = node.args[0]
                node.args[0] = new UglifyJS.AST_String({
                    value: id
                })
                node.args[1] = new UglifyJS.AST_Array({
                    elements: Object.keys(remains).map(function(id) {
                        return new UglifyJS.AST_String({
                            value: id
                        })
                    })
                })
            }
        }

        function cleanOtherDeps(node) {
            if (node.args.length === 3 && node.args[1] instanceof UglifyJS.AST_Array) {
                var elements = node.args[1].elements
                elements.forEach(function(element) {
                    remains[element.value] = true
                })
                node.args[1].elements = []
            }
        }

        var has = {},
            semicolon = new UglifyJS.AST_EmptyStatement()

        function duplicateModule(node) {
            if (node.args.length === 3) {
                var id = node.args[0].value
                delete remains[id]
                if (has[id]) {
                    return semicolon
                }
                has[id] = true
                return node
            }
        }

        ast = ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.args.length) {
                cleanOtherDeps(node)
                return duplicateModule(node)
            }
        }))

        ast = ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define' && node.args.length) {
                anonymousModule(node)
            }
        }))

        return this.uglify(ast)
    },
    resolveDependencies: function(meta) {
        var self = this
        var result = {
            remains: {},
            files: {}
        }

        meta.dependencies.forEach(function(id) {
            var isAbs = self.isAbsId(id)

            if (isAbs && !self.options.all) {
                result.remains[id] = true
                return
            }

            var uri = cmd.iduri.absolute(meta.id, id)
            var module = self.concatModule(uri, isAbs ? self.options.paths : null)

            if (module) {
                result.files[uri] = module
            } else {
                result.remains[uri] = true
            }
        })

        return result
    },
    isAbsId: function(id) {
        return id.charAt(0) !== '.'
    },
    getModule: function(id, modulePaths) {
        var self = this
        var module = null,
            uri = cmd.iduri.appendext(id)

        module = this.moduleCache(id)
        if (module !== undefined) {
            if(module === null) {
                console.log('Null module ' + id)
            }
            return module
        }
        if (modulePaths) {
            modulePaths.some(function(basepath) {
                return module = self.getFile(uri, basepath)
            })
        } else {
            module = this.getFile(uri)
        }

        this.moduleCache(id, module)
        return module
    },
    saveFile: function(filepath, file) {
        var realpath = path.join(this.options.dest, filepath)
        mkdirp.sync(path.dirname(realpath))
        fs.writeFileSync(realpath, file)
        console.log('Saved %s ok.', filepath)
    },
    getFile: function(filepath, basepath) {
        var extname = path.extname(filepath)

        if (!/\.(js|css)$/.test(extname)) {
            filepath += '.js'
        }

        var realpath = path.join(basepath || './', filepath)

        if (fs.existsSync(realpath)) {
            var file = fs.readFileSync(realpath).toString()
            return path.extname(realpath) === '.css' ? this.css2js(filepath, file) : file
        } else {
            console.log('Not found %s', realpath)
            return null
        }
    },
    css2js: function(id, file) {
        var tpl = [
            'define("%s", [], function() { ',
            'seajs.importStyle(%s)',
            ' });'
        ].join('')
        file = util.format(tpl, id, JSON.stringify(file).replace(/(\s|\\n|\\r)+/g, ' '))
        return file || null
    },
    uglify: function(ast) {
        if (!this.options.minify) {
            return ast.print_to_string({
                beautify: true
            })
        }
        ast.figure_out_scope()
        var compressor = UglifyJS.Compressor({
            warnings: false
        })
        ast = ast.transform(compressor)
        ast.figure_out_scope()
        ast.compute_char_frequency()
        ast.mangle_names()
        return ast.print_to_string()
    }
})

module.exports = function(options) {
    return new Builder(options)
}
