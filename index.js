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

function builder(options) {
    return new Builder(options)
}
module.exports = builder

extend(builder, {
    cache: cache,
    UglifyJS: UglifyJS,
    saveFile: function(filepath, file) {
        mkdirp.sync(path.dirname(filepath))
        fs.writeFileSync(filepath, file)
    }
})

function Builder(options) {
    var defaults = {
        all: false,
        paths: ['sea-modules'],
        dest: 'sea-modules',
        minify: true,
        exclude: []
    }

    this.options = extend(defaults, options)

    var cwd = null
    if (this.options.cwd) {
        cwd = process.cwd()
        process.chdir(this.options.cwd)
    }

    this.build()

    if (cwd) {
        process.chdir(cwd)
    }
}

extend(Builder.prototype, {
    moduleCache: function(id, module) {
        if (module !== undefined) {
            cache[id] = module
            return module
        } else {
            module = cache[id]
            return module
        }
    },
    build: function() {
        var self = this
        var filespath = []

        console.log('Starting build: %s', color(self.options.src))

        if (fs.statSync(self.options.src).isFile()) {
            filespath = filespath.concat(self.options.src)
        } else {
            filespath = glob.sync(path.join(self.options.src, '**'), {
                cache: 1
            })
        }
        filespath.forEach(function(uri) {
            if (!fs.statSync(uri).isFile()) {
                return
            }
            var module = null,
                logText = 'Build to %s ok.'
            if (path.extname(uri) === '.js') {
                module = self.concatModule(uri)
            } else {
                module = fs.readFileSync(uri)
                logText = 'Copy to %s ok.'
            }

            if (module) {
                self.saveFile(uri, module, logText)
            }
        })
    },
    concatModule: function(uri, modulePaths) {
        uri = cmd.iduri.normalize(uri)

        var module = this.getModule(uri, modulePaths)
        if (!module) {
            return module
        }
        var meta = cmd.ast.parseFirst(module)
            // 非 CMD 模块
        if (meta === undefined) {
            return module
        }
        // 已经构建好的模块
        if (meta.id) {
            return module
        }

        meta.id = uri.replace(/\.js$/, '')
        var deps = this.getDeps(meta)

        module += ';' + Object.keys(deps.files).map(function(id) {
            return deps.files[id]
        }).join('')

        return this.cleanModule(meta.id, deps.remains, module)
    },
    getDeps: function(meta) {
        var self = this
        var result = {
            remains: {},
            files: {}
        }

        meta.dependencies.forEach(function(id) {
            var isAbs = id.charAt(0) !== '.'
            var uri = cmd.iduri.absolute(meta.id, id)

            if ((self.options.exclude.indexOf(uri) > -1) || (isAbs && !self.options.all)) {
                result.remains[uri] = true
                return
            }

            var module = self.concatModule(uri, isAbs ? self.options.paths : null)

            if (module) {
                result.files[uri] = module
            } else {
                result.remains[uri] = true
            }
        })

        return result
    },
    cleanModule: function(id, remains, module) {
        var ast = UglifyJS.parse(module)
        var cache = {},
            undefinedNode = new UglifyJS.AST_Atom()
        var anonymousNodes = []

        function anonymousModule(node) {
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

        function cleanOtherDeps(node) {
            if (node.args[1] instanceof UglifyJS.AST_Array) {
                var elements = node.args[1].elements
                elements.forEach(function(element) {
                    remains[element.value] = true
                })
                node.args[1].elements = []
            }
        }

        function hasDuplicateModule(node) {
            if (node.args[0] instanceof UglifyJS.AST_String) {
                var id = node.args[0].value
                delete remains[id]
                if (cache[id]) {
                    return true
                } else {
                    cache[id] = true
                }
            }
        }

        ast = ast.transform(new UglifyJS.TreeTransformer(function(node) {
            if (node instanceof UglifyJS.AST_Call && node.expression.name === 'define') {
                if (node.args.length === 1) {
                    anonymousNodes.push(node)
                } else if (node.args.length === 3) {
                    if (hasDuplicateModule(node)) {
                        return undefinedNode
                    }
                    cleanOtherDeps(node)
                    return node
                }
            }
        }))

        anonymousNodes.forEach(anonymousModule)

        return this.minify(ast)
    },
    getModule: function(id, modulePaths) {
        var self = this
        var module = null,
            uri = cmd.iduri.appendext(id)

        module = this.moduleCache(id)
        if (module === null) {
            console.log('Null ' + id)
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
    css2js: function(id, file) {
        var tpl = [
            'define("%s", [], function() { ',
            'seajs.importStyle(%s)',
            ' });'
        ].join('')
        file = util.format(tpl, id, JSON.stringify(file).replace(/(\s|\\n|\\r)+/g, ' '))
        return file || null
    },
    minify: function(ast) {
        if (!this.options.minify) {
            return ast.print_to_string({
                beautify: true
            })
        }

        ast.figure_out_scope()
        ast = ast.transform(UglifyJS.Compressor({
            warnings: false
        }))
        ast.figure_out_scope()
        ast.compute_char_frequency()
        ast.mangle_names()
        return ast.print_to_string({
            ascii_only: true
        })
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
            console.log('Not found %s', color(realpath))
            return null
        }
    },
    saveFile: function(filepath, file, logText) {
        var realpath = path.join(this.options.dest, filepath)
        builder.saveFile(realpath, file)
        console.log(logText, color(realpath))
    }
})