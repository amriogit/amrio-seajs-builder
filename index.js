try{
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var glob = require('glob')
var cmd = require('cmd-util')
var grunt = require('grunt')

process.chdir('test/assets/')

var cache = {},
    paths = ['.tmp', 'sea-modules']

function build(options) {
    cache = {}
    var result = []
    var files = glob.sync(path.join(options.src, '**/*.js'))

    files.forEach(function(filepath) {
        var data = recursiveConcat(filepath)
        grunt.file.write(path.join(options.dest, filepath), data)
        console.log('Build %s success.\n', ('"' + filepath + '"').cyan)
    })
}

function recursiveConcat(filepath) {
    if (cache[id]) {
        return cache[id]
    }

    var result = ''
    var id = filepath.replace('.js', '')
    var data = fs.readFileSync(filepath).toString()
    var ast = cmd.ast.getAst(data)
    var deps = getDepsByAst(ast, path.dirname(id))

    ast = cmd.ast.modify(ast, {
        id: id,
        dependencies: deps.remain
    })

    result = ast.print_to_string({
        beautify: true,
        comments: true
    })

    if (deps.files.length) {
        result += '\n\n' + deps.files.join('\n\n')
    }

    cache[id] = result

    return result
}

function getDepsByAst(ast, base) {
    var records = {}
    var result = {
        remain: [],
        files: []
    }

    cmd.ast.parseFirst(ast).dependencies.forEach(function(dep) {
        if (result.remain.indexOf(dep) === -1) {
            var file = getFile(dep, base)
            if (file === undefined) {
                result.remain.push(dep)
            } else {
                if (!records[dep]) {
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

function getDefineIdsInData(ast) {
    return cmd.ast.parse(ast).filter(function(m) {
        return m.id
    }).map(function(m) {
        return m.id
    })
}

function getFile(id, base) {
    var ext = path.extname(id)

    if (!ext) {
        id += '.js'
    }

    if (id.charAt(0) === '.') {
        id = cmd.iduri.normalize(path.join(base, id))
        if (ext === '.css') {
            return css2js(id)
        }
        return recursiveConcat(id)
    } else {
        if (ext === '.css') {
            return css2js(findIdInPaths(id))
        }
        return fs.readFileSync(findIdInPaths(id)).toString()
    }
}

function findIdInPaths(id) {
    var result = null
    var has = paths.some(function(p) {
        var filepath = path.join(p, id)
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
    var tpl = [
        'define("%s", [], function() {',
        '   seajs.importStyle(%s)',
        '});'
    ].join('\n')

    var code = fs.readFileSync(id).toString()
    code = util.format(tpl, id, JSON.stringify(code).replace(/(\s|\\n|\\r)+/g, ' '))
    return code
}

function test() {
    build({
        src: 'amrio',
        dest: '.tmp'
    })
    build({
        src: 'biz',
        dest: '.tmp'
    })

    cache
}

console.log(1)
// test()
module.exports = build

}catch(e){
    console.log(e)
}