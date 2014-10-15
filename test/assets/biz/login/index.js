define(function(require, exports, module) {
    'use strict'

    var tips = require('../../amrio/tips/index')

    var msgs = require('./error-msg')
    require('./style.css')

    module.exports = function() {
        tips.show('login success')
    }
})