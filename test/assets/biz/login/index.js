define(function(require, exports, module) {
    'use strict'

    var $ = require('$')
    var angular = require('angular')
    require('amrio/tips/style.css')
    var tips = require('amrio/tips/index')
    require('amrio/tools/index')

    var msgs = require('./error-msg')
    require('./style.css')

    module.exports = function() {
        tips.show('login success')
    }
})