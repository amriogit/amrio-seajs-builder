function extend() {
    var args = Array.prototype.slice.call(arguments, 0)
    var dest = args.shift()
    args.forEach(function(src) {
        if (!src) return
        Object.keys(src).map(function(k) {
            dest[k] = src[k]
        })
    })
    return dest
}

function color(text) {
    return util.inspect(text, {
        colors: true
    })
}

exports.extend = extend
exports.color = color
