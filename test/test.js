var fs = require('fs'),
    assert = require('assert')

var builder = require('../')

process.chdir('test/assets')

describe('builder', function() {
    it('builder relative', function() {
        builder({
            src: 'amrio',
            all: false,
            minify: false
        })
        var expected = fs.readFileSync('amrio/tips/index.js.expected').toString()
        var actual = fs.readFileSync('sea-modules/amrio/tips/index.js').toString()
        assert.strictEqual(actual, expected)
    })

    it('builder all', function() {
        builder({
            src: 'biz/login/index.js',
            all: true,
            minify: false
        })
        var expected = fs.readFileSync('biz/login/index.js.expected').toString()
        var actual = fs.readFileSync('sea-modules/biz/login/index.js').toString()
        assert.strictEqual(actual, expected)
    })
})
