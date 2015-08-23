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
        var src = null

        if (!dest) {
            return dest
        }

        for (var i = 0; i < args.length; i++) {
            src = args[i]

            if (!src) {
                continue
            }

            Object.keys(src).forEach(function(k) {
                if (helper.isObject(dest[k]) && helper.isObject(src[k])) {
                    helper.extend(dest[k], src[k])

                } else if (helper.isObject(src[k])) {
                    helper.extend(dest[k] = {}, src[k])
                } else {
                    dest[k] = src[k]
                }
            })
        }

        return dest
    },
    arrayRemove: function (array, item) {
        var index =array.indexOf(item)
        index > -1 && array.splice(index, 1)
        return array
    },
    unique: function(list) {
        var result = []
        var item = null
        
        for (var i = 0; i < list.length; i++) {
            item = list[i]
            item && result.indexOf(item) === -1 && result.push(item)
        }

        return result
    }
}

module.exports = helper
