var fs = require('fs'),
    assert = require('assert')

var builder = require('../')

function removeImpurity(file) {
    return file.toString().replace(/(\n|\r|\s)/g, '')
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
        var expected = fs.readFileSync('amrio/tips/index.js.expected')
        var actual = fs.readFileSync('sea-modules/amrio/tips/index.js')
        assert.strictEqual(removeImpurity(actual), removeImpurity(expected))
    })

    it('builder all', function() {
        builder('biz/login/index.js', {
            all: true,
            minify: false,
            exclude: ['$', 'angular']
        })
        var expected = fs.readFileSync('biz/login/index.js.expected')
        var actual = fs.readFileSync('sea-modules/biz/login/index.js')
        assert.strictEqual(removeImpurity(actual), removeImpurity(expected))
    })
})