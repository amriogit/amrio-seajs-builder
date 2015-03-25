var fs = require('fs'),
    util = require('util'),
    should = require('should'),
    path = require('path'),
    del = require('del')

var H = require('../lib/helper')

var asb = require('../index')

var basePath = 'test/fixtures'
var distPath = 'test/dist'

function fileEqual(expectedPath, actualPath, buildPath) {
    buildPath || (buildPath = distPath)
    var rFileSpace = /(\s|\\r|\\n)/g
    var expected = fs.readFileSync(path.join('test/expected', expectedPath)).toString().replace(rFileSpace, '')
    var actual = fs.readFileSync(path.join(buildPath, actualPath)).toString().replace(rFileSpace, '')
    actual.should.be.equal(expected)
}

var baseOptions = {
    base: basePath,
    dest: distPath,
    paths: [basePath],
    minify: false,
    all: false
}

describe('asb', function() {

    afterEach(function() {
        del.sync(distPath)
    })

    it('options.all: false', function() {
        asb('amrio/tips/index.js', H.extend({}, baseOptions, {
            all: false
        }))

        fileEqual('options.all.false.js', 'amrio/tips/index.js')
    })

    it('options.all: true', function() {

        asb('biz/login/index.js', H.extend({}, baseOptions, {
            all: true
        }))

        fileEqual('options.all.true.js', 'biz/login/index.js')
    })

    it('options.base: test/fixtures/biz', function() {

        asb('login/index.js', H.extend({}, baseOptions, {
            base: 'test/fixtures/biz',
            paths: ['test/fixtures/biz']
        }))

        fileEqual('options.base.js', 'login/index.js')
    })

    it('options.dest: build', function() {
        var buildPath = 'test/build'

        asb('amrio/tips/index.js', H.extend({}, baseOptions, {
            dest: buildPath,
            all: false
        }))

        fileEqual('options.all.false.js', 'amrio/tips/index.js', buildPath)

        del.sync(buildPath)
    })

    it('options.paths: [test]', function() {
        var buildPath = 'test/build'

        asb('fixtures/biz/login/index.js', H.extend({}, baseOptions, {
            base: 'test',
            paths: ['test', 'test/fixtures'],
            all: true
        }))

        fileEqual('options.paths.js', 'fixtures/biz/login/index.js')
    })

    it('options.exclude: [$]', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            all: true,
            exclude: ['biz/login/error-msg']
        }))

        fileEqual('options.exclude.array.js', 'biz/login/index.js')
    })

    it('options.exclude: function return null', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            all: true,
            exclude: function(id) {
                if (id === 'biz/login/error-msg') {
                    return null
                }
            }
        }))

        fileEqual('options.exclude.function.return.null.js', 'biz/login/index.js')
    })

    it('options.minify: true', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            minify: true,
            all: true
        }))

        fileEqual('options.minify.true.js', 'biz/login/index.js')
    })

    it('options.parsers: css', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            parsers: {
                '.css': function(meta) {
                    var cssTemplate = 'define("%s", [], function() { seajs.importStyle(%s); });'
                    var source = null
                    if (fs.existsSync(meta.uri)) {
                        var source = fs.readFileSync(meta.uri).toString()
                        source = util.format(cssTemplate, meta.id, JSON.stringify(source))
                    }
                    return source
                }
            }
        }))

        fileEqual('options.parsers.css.js', 'biz/login/index.js')
    })

    it('options.copyOther: true', function() {
        asb('biz/login/**', H.extend({}, baseOptions, {
            copyOther: true
        }))

        fileEqual('options.copyOther.true.js', 'biz/login/error-msg.js')
    })

    it('options.footer: "footer"', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            footer: "\n// footer \n"
        }))

        fileEqual('options.footer.js', 'biz/login/index.js')
    })

    it('options.uglify: true', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            minify: true,
            uglify: {
                beautify: true
            }
        }))

        fileEqual('options.uglify.js', 'biz/login/index.js')
    })

    it('options.onPost: function', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            onPost: function(filepath, file) {
                filepath.should.be.equal(path.join('test/dist/biz/login/index.js'))
                file.toString().should.startWith('define("biz/login/index"')
            }
        }))
    })

    it('options.log: true', function() {
        asb('biz/login/index.js', H.extend({}, baseOptions, {
            log: function(text) {
                text.should.startWith('asb spend')
            }
        }))
    })
})
