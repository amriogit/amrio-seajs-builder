var util = require('util')

var OP = Object.prototype
var AP = Array.prototype

var helper = {
    type: function(obj) {
        return OP.toString.call(obj).slice(8, -1)
    },
    isObject: function(obj) {
        return helper.type(obj) === 'Object'
    },
    isArray: function(array) {
        return Array.isArray(array)
    },
    extend: function() {
        var args = AP.slice.call(arguments, 0)
        var dest = args.shift()

        if(!dest) {
            return dest
        }
        
        args.forEach(function(src) {
            if (!src) return
            Object.keys(src).map(function(k) {
                if (helper.isObject(dest[k]) && helper.isObject(src[k])) {
                    helper.extend(dest[k], src[k])

                } else {
                    dest[k] = src[k]
                }
            })
        })
        return dest
    },
    color: function(text) {
        return util.inspect(text, {
            colors: true
        })
    },
    unique: function(list) {
        var result = []
        list.forEach(function(item) {
            result.indexOf(item) === -1 && result.push(item)
        })
        return result
    },
    asyncEachSeries: function(array, iterator, callback) {
        var index = 0

        function next() {
            if (index >= array.length) {
                callback()
            } else {
                iterator(array[index++], next)
            }
        }

        next()
    },
    asyncEach: function(array, iterator, callback) {
        var index = 0
        var len = array.length

        function done() {
            if (++index >= len) {
                callback()
            }
        }

        if (array.length === 0) {
            callback()
        } else {
            array.forEach(function(item) {
                iterator(item, done)
            })
        }
    }
}

module.exports = helper
