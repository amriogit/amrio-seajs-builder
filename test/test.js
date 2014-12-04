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

    before(function() {
        process.chdir('test/assets')
    })

    it('builder relative', function() {
        builder('amrio', {
            all: false,
            minify: false
        })

        fileEqual('amrio/tips/index.js.expected', 'sea-modules/amrio/tips/index.js')
    })

    it('builder all', function() {
        builder('biz/login/index.js', {
            all: true,
            minify: false,
            exclude: ['$', 'angular']
        })

        fileEqual('biz/login/index.js.expected', 'sea-modules/biz/login/index.js')
    })
})
