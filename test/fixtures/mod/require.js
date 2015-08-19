define(function(require, exports, module) {
    
    require('a', function(){})

    require('')
    require()
    require(a)

    require('b')

    require('./b')

    require(['a'])

    require.async()
    require.async([a])
    
    require.async('a', function(){})

    require.async('c')

    require.async(['a', 'b'], function(){})

    require.async(['a', 'b', 'c'])

    require.async(['c'])
})