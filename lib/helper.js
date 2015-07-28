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
    unique: function(list) {
        var result = []
        list.forEach(function(item) {
            item && result.indexOf(item) === -1 && result.push(item)
        })
        return result
    },
    normalize: function(uri) {
        if (!uri) {
            return uri
        }
        return uri.replace(/\\/g, '/')
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
