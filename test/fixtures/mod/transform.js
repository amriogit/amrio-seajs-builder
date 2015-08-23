new function () {
    var define
    define(function(require) {
        require('a')
    })
}

define(function(require, exports, module) {

    var define

    define(function () {
        require('c')
    })

    require()
    require(a)
    require('')
    require(null)
    require('a')
    require('a', function(){})
    require(' a ')
    require('./a')
    require(['a'])
    require(['./{lang}'])
    require('./{lang}')

    require.async()
    require.async(null)
    require.async([null, 'a'])
    require.async([])
    require.async([b])
    require.async('b', function(){})
    require.async(' c ')
    require.async([' a ', 'b'], function(){})
    require.async(['a', 'b', 'c'])
    require.async(['c'])
    require.async(['a', './{lang}'])
})

require('a')
require('./a')
require.async('./a')
require.async('./{lang}')

define()

define('foo', function(require) {
    require('b')
})

define([], function(require) {
    require('b')
})

define('bar', [], null)

