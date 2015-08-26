var fs = require('fs')
var util = require('util')
var path = require('path')
var exec = require('child_process').exec

var _ = require('lodash')
var should = require('should')
var del = require('del')

var asb = require('../')

var basePath = 'test/fixtures'
var destPath = 'test/dist'

var rLinefeed = /\r\n/g

function fileEqual(expectedPath, actualPath) {

    var expected = String(fs.readFileSync(path.join('test/expected', expectedPath)))
        .replace(rLinefeed, '\n')

    var actual = String(fs.readFileSync(path.join(destPath, actualPath)))
        .replace(rLinefeed, '\n')

    // actual.should.be.equal(expected)
    actual.length.should.be.equal(expected.length)
}

function genOptions(options) {
    return _.merge({
        cwd: basePath,
        base: basePath,
        dest: destPath,
        minify: false,
        exclude: ["$", "angular", "bootstrap"],
        all: false,
        log: true
    }, options)
}

describe('asb', function() {

    after(function() {
        del.sync(destPath)
    })

    it('options.all: false', function(done) {
        asb('amrio/tips/index.js', genOptions({
            all: false
        })).then(function() {
            fileEqual('options.all.false.js', 'amrio/tips/index.js')

        }).then(done, done)
    })

    it('options.all: true', function(done) {

        asb('biz/login/index.js', genOptions({
            all: true
        })).then(function() {
            fileEqual('options.all.true.js', 'biz/login/index.js')
        }).then(done, done)
    })

    it('options.cwd: test/fixtures/biz', function(done) {

        asb('login/index.js', genOptions({
            cwd: 'test/fixtures/biz',
            base: 'test/fixtures/biz'
        })).then(function() {
            fileEqual('options.base.js', 'login/index.js')
        }).then(done, done)

    })

    it('options.dest: build', function(done) {
        var dest = 'test/build'

        asb('amrio/tips/index.js', genOptions({
            dest: dest
        })).then(function() {
            fileEqual('options.all.false.js', '../build/amrio/tips/index.js', dest)
            del.sync(dest)
        }).then(done, done)
    })

    it('options.paths: [fixtures]', function(done) {

        asb('fixtures/biz/login/index.js', genOptions({
            cwd: 'test',
            all: true,
            paths: {
                'fixtures': './fixtures'
            }
        })).then(function() {
            fileEqual('options.paths.js', 'fixtures/biz/login/index.js')
        }).then(done, done)

    })

    it('options.alias: $', function(done) {

        var a = asb('amrio/tips/index.js', genOptions({
            exclude: ["angular", "bootstrap"],
            alias: {
                '$': 'biz/login/other'
            },
            all: true
        })).then(function() {
            fileEqual('options.alias.js', 'amrio/tips/index.js')
        }).then(done, done)
    })

    it('options.vars: { id: "b" }', function(done) {

        asb('mod/vars.js', genOptions({
            vars: {
                'id': 'b'
            },
            all: true
        })).then(function() {
            fileEqual('options.vars.js', 'mod/vars.js')
        }).then(done, done)
    })

    it('options.exclude: [biz/login/error-msg]', function(done) {
        asb('biz/login/index.js', genOptions({
            all: true,
            exclude: ['biz/login/error-msg']
        })).then(function() {
            fileEqual('options.exclude.array.js', 'biz/login/index.js')
        }).then(done, done)

    })

    it('options.exclude: function return null', function(done) {
        asb('biz/login/index.js', genOptions({
            all: true,
            exclude: function(id) {
                if (id === 'biz/login/error-msg') {
                    return null
                }
            }
        })).then(function() {
            fileEqual('options.exclude.function.return.null.js', 'biz/login/index.js')
        }).then(done, done)

    })

    it('options.minify: true', function(done) {
        asb('biz/login/index.js', genOptions({
            minify: true,
            all: true
        })).then(function() {
            fileEqual('options.minify.true.js', 'biz/login/index.js')
        }).then(done, done)

    })

    it('options.copyOther: true', function(done) {
        asb('biz/login/**', genOptions({
            copyOther: true
        })).then(function() {
            fileEqual('options.copyOther.true.js', 'biz/login/error-msg.js')
        }).then(done, done)

    })

    it('options.connector: "connector"', function(done) {
        asb('biz/login/index.js', genOptions({
            connector: "\n// footer \n"
        })).then(function() {
            fileEqual('options.footer.js', 'biz/login/index.js')
        }).then(done, done)

    })

    it('options.uglify: false', function(done) {
        asb('biz/login/index.js', genOptions({
            minify: false
        })).then(function() {
            fileEqual('options.uglify.js', 'biz/login/index.js')
        }).then(done, done)

    })

    it('options.onPost: function', function(done) {
        asb('biz/login/index.js', genOptions({
            onPost: function(dest, module, resolve, reject) {
                dest.should.be.equal('test/dist/biz/login/index.js')
                module.result.toString().should.startWith('define("biz/login/index"')
                resolve()
            }
        })).then(done, done)
    })

    it('add parser: tmpl', function(done) {

        var tplTemplate = 'define("%s", [], %s);'

        asb.parsers.add('.tmpl', function(meta, resolve, reject) {

            asb.parsers.readFile(meta.uri).then(function(file) {

                file = JSON.stringify(file).replace(/(\s|\\n|\\t|\\r)+/g, ' ')
                file = util.format(tplTemplate, meta.id, file)
                resolve(file)

            }).catch(reject)
        })

        asb('mod/template.tmpl', genOptions()).then(function() {
            fileEqual('options.parsers.tmpl.js', 'mod/template.tmpl.js')
        }).then(done, done)
    })

    it('transform', function(done) {
        asb('mod/transform.js', genOptions({
            alias: {
                a: './a'
            },
            vars: {
                lang: 'b'
            }
        })).then(function() {
            fileEqual('transform.js', 'mod/transform.js')
        }).then(done, done)
    })

    it('cli', function(done) {
        var cmd = [
            'node ./cli.js',
            '-s', 'amrio/tips/index.js',
            '-c', basePath,
            '-b', basePath,
            '-d', destPath,
            '-a', '$:biz/login/other',
            '--config', './test/asb.config.js',
            '--all',
            '--no-minify'
        ].join(' ')

        console.log('\n' + cmd + '\n')

        exec(cmd, function(err, sto, ste) {
            if (err) {
                throw err
            } else {
                sto && console.log(sto)
                ste && console.log(ste)

                fileEqual('options.alias.js', 'amrio/tips/index.js')
                done()
            }
        })

    })
})
