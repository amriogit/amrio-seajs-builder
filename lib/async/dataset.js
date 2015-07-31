function DataSet() {
    this.set = new Set()
    this.size = 0
}

DataSet.prototype.add = function(value) {
    this.set.add(value)
}

DataSet.prototype.delete = function(value) {
    this.set.delete(value)
}

DataSet.prototype.has = function(value) {
    return this.set.has(value)
}

DataSet.prototype.values = function() {
    var result = []
    var values = this.set.values()
    for (var s of values) {
        result.push(s)
    }
    return result
}

DataSet.prototype.keys = function() {
    var result = []
    var keys = this.set.keys()
    for (var s of keys) {
        result.push(s)
    }
    return result
}

module.exports = DataSet
