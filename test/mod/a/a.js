define(function(require, exports, module){ 
    require('./a.css')
    require('mod/b/b.css')
    require.async('./index.tpl')
    require('./index.tpl')
    var b = require('mod/b/b') 
    console.log(b)
    return 'a'
})