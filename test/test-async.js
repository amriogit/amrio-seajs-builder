var fs = require('fs')
var asb = require('../index')

var options = {
    base: './test/fixtures',
    cwd: './test/fixtures/',
    minify: true,
    all: true,
    uglify: {
        compress: {
            drop_console: true
        }
    },
    exclude: ['T'],
    alias: {
        'T': 'amrio/tools/index'
    }
}

asb('**', options).then(function () {
    console.log('asb finish')
})