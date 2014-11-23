'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')

var helper = require('./helper')
var config = require('./config')

function parsePaths(id) {
    var paths = config.data.paths
    Object.keys(paths).some(function(p) {
        if (id.indexOf(p) > -1) {
            id = id.replace(p, paths[p])
            return true
        }
    })
    return id
}

function parseAlias(id) {
    return config.data.alias[id] || id
}

module.exports = {
    id2uri: function(id, base) {
        id = parseAlias(id)
        id = parsePaths(id)
        id = cmd.iduri.appendext(id)
        id = cmd.iduri.absolute(base || '', id)
        return id
    }
}