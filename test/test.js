var fs = require('fs'),
    assert = require('assert')

var builder = require('../')

process.chdir('test/assets')

function removeImpurity(file) {
    return file.toString().replace(/\n|\r|\s/g, '')
}
describe('builder', function() {
    it('builder relative', function() {
        builder({
            src: 'amrio',
            all: false,
            minify: false
        })
        var expected = fs.readFileSync('amrio/tips/index.js.expected')
        var actual = fs.readFileSync('sea-modules/amrio/tips/index.js')
        assert.strictEqual(removeImpurity(actual), removeImpurity(expected))
    })

    it('builder all', function() {
        builder({
            src: 'biz/login/index.js',
            all: true,
            minify: false
        })
        var expected = fs.readFileSync('biz/login/index.js.expected')
        var actual = fs.readFileSync('sea-modules/biz/login/index.js')
        assert.strictEqual(removeImpurity(actual), removeImpurity(expected))
    })
})
