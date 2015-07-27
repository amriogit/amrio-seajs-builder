var fs = require('fs')
var ModuleManager = require('../lib/async/module-manager')

var moduleManager = new ModuleManager({
    base: './test/fixtures',
    minify: false,
    onlyRel: false,
    alias: {
        'T': 'tools/index'
    }
})

moduleManager.get({
    id: 'mod/main'
}).then(function(mod) {
    fs.writeFile('./test.js', mod.result)

}).catch(function(err) {
    console.error(err.stack)
})
