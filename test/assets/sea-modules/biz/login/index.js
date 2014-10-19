define(function(require, exports, module) {
    'use strict'

    var tips = require('amrio/tips/index')
    require('amrio/tips/style.css')
    require('amrio/tools/index')

    var msgs = require('./error-msg')
    require('./style.css')

    module.exports = function() {
        tips.show('login success')
    }
})