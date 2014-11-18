(function() {
    if (define.cmd) {
        define(function test(require, exports, module) {
            'use strict'
            require('./lala')
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

            require('./nocmd')
            require('./nocmd')
            require('./nocmd')

            var define = window.define

            define('inner/index', ['inner-define', './inner-define'], function(m1, m2) {
                console.log(m1, m2)
            })
        })
    }
})();
