var fs = require('fs')
var ModuleManager = require('../lib/async/module-manager')

var moduleManager = new ModuleManager({
    base: './test/fixtures',
    minify: false,
    all: true,
    exclude: [],
    alias: {
        'T': 'amrio/tools/index'
    }
})

moduleManager.on('error', function (err) {
    console.error(err.stack)
})

moduleManager.get({
    // id: 'mod/main',
    uri: './test/fixtures/mod/main.js'
}).then(function(mod) {
    fs.writeFile('./test.js', mod.result)

})
