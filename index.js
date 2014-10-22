var fs = require('fs'),
    path = require('path'),
    util = require('util')

var glob = require('glob')
var cmd = require('cmd-util')
var grunt = require('grunt')
var UglifyJS = cmd.UglifyJS

function main(options) {
    var cache = {},
        paths = ['sea-modules']

    function start(options) {
        var filespath = []
        if (fs.statSync(options.src).isFile()) {
            filespath = filespath.concat(options.src)
        } else {
            filespath = glob.sync(path.join(options.src, '**/*.js'))
        }

        if(options.paths) {
            paths = paths.concat(options.paths)
        }

        filespath.forEach(function(filepath) {
            var data = concat(filepath)
            data = cleanCode(data)
            grunt.file.write(path.join(options.dest, filepath), data)
            console.log('Build %s success.', ('"' + filepath + '"').cyan)
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
        var deps = getModuleAllDeps(ast, path.dirname(id))

        ast = cmd.ast.modify(ast, {
            id: id,
            dependencies: deps.remain
        })

        var result = ast.print_to_string()

        if (deps.files.length) {
            result += '\n\n' + deps.files.join('\n\n')
        }

        cache[id] = result

        return result
    }

    function getModuleAllDeps(ast, base) {
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

        meta.dependencies.forEach(function(dep) {
            if (result.remain.indexOf(dep) === -1) {
                var file = getFile(dep, base)
                if (file === undefined) {
                    result.remain.push(dep)
                } else {
                    if (!records[dep]) {
                        result.remain = grunt.util._.union(result.remain, getModuleAllDeps(file, dep).remain)
                        updateRecords(file)
                        result.files.push(file)
                    }
                }
            } else {
                result.remain.push(dep)
            }
        })

        function updateRecords(file) {
            cmd.ast.parse(file).forEach(function(m) {
                records[m.id] = true
            })
        }

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
            filepath = getAvailableFilePath(id)
            if (!filepath) {
                return
            }
            if (ext === '.css') {
                return css2js(filepath)
            }
            return fs.readFileSync(filepath).toString()
        }
    }

    function getAvailableFilePath(id) {
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
            console.log('Can\'t find top-level ID %s', ('"' + id + '"').cyan)
        }

        return result
    }

    function css2js(id) {
        if(!fs.existsSync(id)) {
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

    start(options)
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
