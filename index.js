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
    var cache1 = {},
        paths = ['sea-modules']

    var options = {
        minify: true,
        all: false,
        dest: 'sea-modules'
    }

    function start() {
        extend(options, opts)

        console.log('Start %s', options.src)

        var filespath = []
        if (fs.statSync(options.src).isFile()) {
            filespath = filespath.concat(options.src)
        } else {
            filespath = glob.sync(path.join(options.src, '**/*.{js,css}'))
        }

        if (options.paths) {
            paths = paths.concat(options.paths)
        }

        var len = filespath.length - 1,
            jsCount = 0
        filespath.forEach(function(filepath, i) {
            var realFilepath = path.join(options.dest, filepath)
            if (path.extname(filepath) === '.css') {
                console.log('Copy %s success.', '"' + filepath + '"')
                writeFile(realFilepath, fs.readFileSync(filepath))
                return
            }
            var data = concat(filepath)

            writeFile(realFilepath, data)
            console.log('Build %s success.', '"' + filepath + '"')

            jsCount++
            if (len === i) {
                console.log('Builded %s files.', jsCount)
            }
        })
    }

    function writeFile(filepath, data) {
        mkdirp.sync(path.dirname(filepath))
        fs.writeFileSync(filepath, data)
    }

    function concat(filepath) {
        var id = filepath.replace(/\.js$/, '')

        if (hitCache(id)) {
            return hitCache(id)
        }

        if (!fs.existsSync(filepath)) {
            return ''
        }

        var data = fs.readFileSync(filepath).toString()
        var ast = cmd.ast.getAst(data)
        var deps = getModuleDeps(ast, path.dirname(id))

        ast = cmd.ast.modify(ast, {
            id: id,
            dependencies: deps.remain
        })

        var result = ast.print_to_string()
        result = cleanCode(result)

        if (deps.files.length) {
            result += '\n' + deps.files.join('\n')
        }

        main.cache[id] = result

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
                        files[dep] = cleanCode(file)
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
        if (hitCache(id)) {
            return hitCache(id)
        }
        var ext = path.extname(id),
            filepath

        if (!ext || ext !== '.css') {
            id += '.js'
        }

        if (id.charAt(0) === '.') {
            filepath = cmd.iduri.normalize(path.join(base, id))
            if (hitCache(filepath)) {
                return hitCache(filepath)
            }
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
            'define("%s", [], function() { ',
            'seajs.importStyle(%s)',
            ' });'
        ].join('')

        var code = fs.readFileSync(id).toString()
        code = util.format(tpl, id, JSON.stringify(code).replace(/(\s|\\n|\\r)+/g, ' '))
        return code
    }

    function cleanCode(code) {
        if (!options.minify) {
            return code
        }
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

function hitCache(id) {
    var cache = main.cache[id]
    if (cache) {
        console.log('Hit cache %s.', '"' + id + '"')
    }
    return false
}

function test() {
    process.chdir('test/assets/')

    main({
        src: 'amrio',
        dest: '.tmp'
    })

    main({
        src: 'biz',
        dest: '.tmp',
        paths: ['.tmp'],
        all: true
    })
}

main.cache = {}
module.exports = main
// test()
