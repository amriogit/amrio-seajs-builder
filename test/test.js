var fs = require('fs'),
    assert = require('assert')

var builder = require('../')

function fileEqual() {
    var result = false
    Array.prototype.slice.call(arguments, 0).map(function(uri) {
        return fs.readFileSync(uri).toString().replace(/\s|\\r|\\n/g, '')
    }).reduce(function(prev, curr) {
        result = prev === curr
        assert.equal(curr, prev, 'FILE NOT EQUAL')
        return prev
    })
    assert.ok(result, 'FILE NOT EQUAL')
    return result
}

describe('builder', function() {

    // before(function() {
    //     process.chdir('test/assets')
    //     this.defined = []
    // })

    // xit('builder relative', function() {
    //     builder('amrio', {
    //         all: false,
    //         minify: false,
    //         defined: this.defined
    //     })

    //     fileEqual('amrio/tips/index.js.expected', 'sea-modules/amrio/tips/index.js')
    // })

    // xit('builder all', function() {
    //     builder('biz/login/index.js', {
    //         all: true,
    //         minify: false,
    //         exclude: ['$', 'angular'],
    //         defined: this.defined
    //     })

    //     fileEqual('biz/login/index.js.expected', 'sea-modules/biz/login/index.js')
    // })

    it('builder TDD', function() {
        var asb = require('../lib/builder')
        asb('biz', {
            base: 'test/assets',
            dest: 'test/sea-modules',
            paths: ['test/assets'],
            exclude: ['$', 'angular', 'bootstrap'],
            minify: false,
            isConcatAll: true
        })
    })
})
