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
        args.forEach(function(src) {
            if (!src) return
            Object.keys(src).map(function(k) {
                if (helper.isObject(dest[k]) && helper.isObject(src[k])) {
                    helper.extend(dest[k], src[k])

                } else if (Array.isArray(dest[k]) && Array.isArray(src[k])) {
                    dest[k].concat(src[k])
                    
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
    asyncEach: function(list, iterator, done) {
        var index = 0

        function next() {
            if (index >= list.length) {
                done()
            } else {
                iterator(list[index++], next)
            }
        }

        next()
    }
}

module.exports = helper
