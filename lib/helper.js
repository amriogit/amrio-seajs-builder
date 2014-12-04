var util = require('util')

var OP = Object.prototype
var AP = Array.prototype

var helper = {
    noop: function() {},
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

        if (!dest) {
            return dest
        }

        args.forEach(function(src) {
            if (!src) return
            Object.keys(src).map(function(k) {
                if (helper.isObject(dest[k]) && helper.isObject(src[k])) {
                    helper.extend(dest[k], src[k])

                } else if (Array.isArray(dest[k]) && Array.isArray(src[k])) {
                    dest[k] = dest[k].concat(src[k])

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
        callback && (callback = helper.noop)

        function next() {
            if (index >= array.length) {
                callback()
            } else {
                var isCalled = false
                iterator(array[index++], function() {
                    isCalled || next()
                    isCalled = true
                })
            }
        }

        next()
    },
    asyncEach: function(array, iterator, callback) {
        var index = 0
        var len = array.length
        callback && (callback = helper.noop)

        function done() {
            if (++index >= len) {
                callback()
            }
        }

        if (array.length === 0) {
            callback()
        } else {
            array.forEach(function(item) {
                var isCalled = false
                iterator(item, function() {
                    isCalled || done()
                    isCalled = true
                })
            })
        }
    }
}

module.exports = helper
