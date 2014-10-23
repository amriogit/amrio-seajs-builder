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
function main(opts) {
    var cache = {},
        paths = ['sea-modules']

    var options = {
        minify: true,
        all: false,
        dest: 'sea-modules'
    }

    function start() {
        extend(options, opts)
        
        console.log('Start %s', color(options.src))

        var filespath = []
        if (fs.statSync(options.src).isFile()) {
            filespath = filespath.concat(options.src)
        } else {
            filespath = glob.sync(path.join(options.src, '**/*.js'))
        }

        if (options.paths) {
            paths = paths.concat(options.paths)
        }

        var len = 0
        filespath.forEach(function(filepath) {
            var data = concat(filepath)

            if (options.minify) {
                data = cleanCode(data)
            }

            filepath = path.join(options.dest, filepath)
            mkdirp(path.dirname(filepath), function(err) {
                if(err) throw err
                fs.writeFile(filepath, data)
                console.log('Build %s success.', '"' + filepath + '"')

                if(++len === filespath.length) {
                    console.log('Builded.')
                }
            })
        })
    }

    function concat(filepath) {
        if (cache[id]) {
            return cache[id]
        }

        if (!fs.existsSync(filepath)) {
            return ''
        }

        var id = filepath.replace(/\.js$/, '')
        var data = fs.readFileSync(filepath).toString()
        var ast = cmd.ast.getAst(data)
        var deps = getModuleDeps(ast, path.dirname(id))

        ast = cmd.ast.modify(ast, {
            id: id,
            dependencies: deps.remain
        })

        var result = ast.print_to_string()

        if (deps.files.length) {
            result += '\n' + deps.files.join('\n')
        }

        cache[id] = result

        return result
    }

    function getModuleDeps(ast, base) {
        ast = cmd.ast.getAst(ast)

        var records = {}
        var result = {
            remain: [],
            files: []
        }

        var meta = cmd.ast.parseFirst(ast)

        if (!meta) {
            return result
        }

        var files = {},
            remain = {}

        meta.dependencies.forEach(function(dep) {
            if (!options.all && dep.charAt(0) !== '.') {
                remain[dep] = true
                return
            }
            if (!remain[dep]) {
                var file = getFile(dep, base)
                if (file === undefined) {
                    remain[dep] = true
                } else {
                    if (!records[dep]) {
                        files[dep] = file
                        updateRecords(file)
                    }
                }
            } else {
                delete remain[dep]
            }
        })

        function updateRecords(file) {
            cmd.ast.parse(file).forEach(function(m, i) {
                records[m.id] = true
                m.dependencies.forEach(function(dep) {
                    remain[dep] = true
                })
                if (i > 0) {
                    delete remain[m.id]
                    delete files[m.id]
                }
            })
        }

        result.files = Object.keys(files).map(function(k) {
            return files[k]
        })

        result.remain = Object.keys(remain)

        return result
    }

    function getFile(id, base) {
        var ext = path.extname(id),
            filepath

        if (!ext || ext !== '.css') {
            id += '.js'
        }

        if (id.charAt(0) === '.') {
            filepath = cmd.iduri.normalize(path.join(base, id))
            if (ext === '.css') {
                return css2js(filepath)
            }
            return concat(filepath)
        } else {
            filepath = getAvailablePath(id)
            if (!filepath) {
                return
            }
            if (ext === '.css') {
                return css2js(filepath)
            }
            return fs.readFileSync(filepath).toString()
        }
    }

    function getAvailablePath(id) {
        var result = null
        if (path.dirname(id) === '.') {
            return null
        }
        var has = paths.some(function(modulesPath) {
            var filepath = path.join(modulesPath, id)
            var exists = fs.existsSync(filepath)
            exists && (result = cmd.iduri.normalize(filepath))
            return exists
        })

        if (!has) {
            console.log('Can\'t find top-level ID %s', color(id))
        }

        return result
    }

    function css2js(id) {
        if (!fs.existsSync(id)) {
            return ''
        }
        var tpl = [
            'define("%s", [], function() {',
            '   seajs.importStyle(%s)',
            '});'
        ].join('\n')

        var code = fs.readFileSync(id).toString()
        code = util.format(tpl, id, JSON.stringify(code).replace(/(\s|\\n|\\r)+/g, ' '))
        return code
    }

    function cleanCode(code) {
        var ast = UglifyJS.parse(code)
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

    start()
}

function test() {
    process.chdir('test/assets/')

    main({
        src: 'amrio',
        dest: '.tmp',
        paths: ['./']
    })

    main({
        src: 'biz',
        dest: '.tmp',
        paths: ['.tmp', './']
    })
}

// test()
module.exports = main
