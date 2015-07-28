define(function(require, exports, module) {
    require('./a')
    require('mod/c')
    // require('mod/a')
    require('T')
    // require('biz/login/index')

    module.exports = 'main'
})