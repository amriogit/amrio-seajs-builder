'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var Module = require('./module')

var moduleCache = {}

function getModule(uri, base) {
    if (moduleCache[uri]) {
        return moduleCache[uri]
    } else {
        return moduleCache[uri] = new Module(uri, base)
    }
}

module.exports = {
    getModule: getModule
}