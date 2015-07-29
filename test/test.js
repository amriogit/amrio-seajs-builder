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
    var rFileSpace = /(\s|\\r|\\n|\\t)/g
    var expected = fs.readFileSync(path.join('test/expected', expectedPath)).toString().replace(rFileSpace, '')
    var actual = fs.readFileSync(path.join(buildPath, actualPath)).toString().replace(rFileSpace, '')
    
	return actual.should.be.equal(expected)
}

function genOptions (options) {
	return H.extend({
		cwd: basePath,
	    base: basePath,
	    dest: distPath,
	    minify: false,
	    exclude: ["$", "angular", "bootstrap"],
	    all: false
	}, options)
}

describe('asb', function() {

    beforeEach(function() {
        // del.sync(distPath)
    })

    it('options.all: false', function(done) {
        asb('amrio/tips/index.js', genOptions({
            all: false
        })).then(function (module) {
        	fileEqual('options.all.false.js', 'amrio/tips/index.js')
        }).then(done).catch(done)
    })

    it('options.all: true', function(done) {

        asb('biz/login/index.js', genOptions({
            all: true
        })).then(function (module) {
        	fileEqual('options.all.true.js', 'biz/login/index.js')
        }).then(done).catch(done)
    })

    it('options.cwd: test/fixtures/biz', function(done) {

        asb('login/index.js', genOptions({
        	cwd: 'test/fixtures/biz',
        	base: 'test/fixtures/biz'
        })).then(function (module) {
        	fileEqual('options.base.js', 'login/index.js')
        }).then(done).catch(done)

    })

    it('options.dest: build', function(done) {
        var buildPath = 'test/build'

        asb('amrio/tips/index.js', genOptions({
            dest: buildPath,
            all: false
        })).then(function (module) {
        	fileEqual('options.all.false.js', 'amrio/tips/index.js', buildPath)
        	del.sync(buildPath)
        }).then(done).catch(done)
    })

    it('options.paths: [test]', function(done) {

        asb('fixtures/biz/login/index.js', genOptions({
        	cwd: 'test',
            all: true,
            paths: {
            	'fixtures': './fixtures'
            }
        })).then(function (module) {
        	fileEqual('options.paths.js', 'fixtures/biz/login/index.js')
        }).then(done).catch(done)

    })

    it('options.alias: $', function(done) {

        var a = asb('amrio/tips/index.js', genOptions({
        	exclude: ["angular", "bootstrap"],
            alias: {
            	'$': 'biz/login/other'
            },
            all: true
        })).then(function (module) {
        	fileEqual('options.alias.js', 'amrio/tips/index.js')

        }).then(done).catch(done)
    })

    it('options.exclude: [biz/login/error-msg]', function(done) {
        asb('biz/login/index.js', genOptions({
            all: true,
            exclude: ["$", "angular", "biz/login/error-msg", "bootstrap"]
        })).then(function (module) {
        	fileEqual('options.exclude.array.js', 'biz/login/index.js')
        }).then(done).catch(done)

    })

    xit('options.exclude: function return null', function(done) {
        asb('biz/login/index.js', genOptions({
            all: true,
            exclude: function(id) {
                if (id === 'biz/login/error-msg') {
                    return null
                }
            }
        })).then(function (module) {
        	fileEqual('options.exclude.function.return.null.js', 'biz/login/index.js')
        }).then(done).catch(done)

    })

    xit('options.minify: true', function(done) {
        asb('biz/login/index.js', genOptions({
            minify: true,
            all: true
        })).then(function (module) {
        	fileEqual('options.minify.true.js', 'biz/login/index.js')
        }).then(done).catch(done)

    })

    xit('options.parsers: css', function(done) {
        asb('biz/login/index.js', genOptions({
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
        })).then(function (module) {
        	fileEqual('options.parsers.css.js', 'biz/login/index.js')
        }).then(done).catch(done)

    })

    xit('options.copyOther: true', function(done) {
        asb('biz/login/**', genOptions({
            copyOther: true
        })).then(function (module) {
        	fileEqual('options.copyOther.true.js', 'biz/login/error-msg.js')
        }).then(done).catch(done)

    })

    xit('options.footer: "footer"', function(done) {
        asb('biz/login/index.js', genOptions({
            footer: "\n// footer \n"
        })).then(function (module) {
        	fileEqual('options.footer.js', 'biz/login/index.js')
        }).then(done).catch(done)

    })

    xit('options.uglify: true', function(done) {
        asb('biz/login/index.js', genOptions({
            minify: true,
            uglify: {
                beautify: true
            }
        })).then(function (module) {
        	fileEqual('options.uglify.js', 'biz/login/index.js')
        }).then(done).catch(done)

    })

    xit('options.onPost: function', function(done) {
        asb('biz/login/index.js', genOptions({
            onPost: function(filepath, file) {
                filepath.should.be.equal(path.join('test/dist/biz/login/index.js'))
                file.toString().should.startWxith('define("biz/login/index"')
            }
        })).then(function (module) {
        }).then(done).catch(done)
    })

    xit('options.log: function', function(done) {
        asb('biz/login/index.js', genOptions({
            log: function(text) {
                should.exist(text)
            }
        })).then(function (module) {
        }).then(done).catch(done)
    })
})