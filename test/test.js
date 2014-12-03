var fs = require('fs'),
    assert = require('assert')

var builder = require('../')

function fileEqual(uri1, uri2) {
    var f1 = fs.readFileSync(uri1).toString()
    var f2 = fs.readFileSync(uri2).toString()
    return f1 == f2
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
        assert.ok(fileEqual('amrio/tips/index.js.expected', 'sea-modules/amrio/tips/index.js'))
    })

    it('builder all', function() {
        builder('biz/login/index.js', {
            all: true,
            minify: false,
            exclude: ['$', 'angular']
        })
        assert.ok(fileEqual('biz/login/index.js.expected', 'sea-modules/biz/login/index.js'))
    })
})