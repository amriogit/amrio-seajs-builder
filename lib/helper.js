var util = require('util')
var path = require('path')

var chalk = require('chalk')

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
    isFunction: function(obj) {
        return helper.type(obj) === 'Function'
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

                } else if (helper.isObject(src[k])) {
                    helper.extend(dest[k] = {}, src[k])
                } else {
                    dest[k] = src[k]
                }
            })
        })
        return dest
    },
    color: function(text) {
        return chalk.green(text)
    },
    unique: function(list) {
        var result = []
        list.forEach(function(item) {
            item && result.indexOf(item) === -1 && result.push(item)
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
    },
    normalize: function(uri) {
        if (!uri) {
            return uri
        }
        return uri.replace(/\\/g, '/')
    },
    ensureExtname: function(uri, parsers) {
        if (!uri) {
            return uri
        }
        if (!parsers[path.extname(uri)]) {
            uri += '.js'
        }
        return helper.normalize(uri)
    },
    absId: function(id, base) {
        if (id.indexOf('.') === 0) {
            id = path.join(path.dirname(base), id)
        }
        return helper.normalize(id)
    },
    log: function(isEnabled, text) {
        if (helper.isFunction(isEnabled)) {
            var log = isEnabled
            log(text)
        } else {
            isEnabled && console.log(text)
        }
    }
}

module.exports = helper
