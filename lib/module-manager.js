var path = require('path')
var util = require('util')
var querystring = require('querystring')
var EventEmitter = require('events').EventEmitter

var Module = require('./module')
var cmdTools = require('./cmd-tools')
var _ = require('lodash')

// Below two RegExp come from seajs
var rPaths = /^([^/:]+)(\/.+)$/
var rVars = /{([^{]+)}/g

var rTopLevel = /^[^\.\\\/]/

var moduleCache = {}

function ModuleManager(options) {
    EventEmitter.call(this)

    var self = this

    this.options = _.merge({
        cwd: './',
        base: './',
        minify: true,
        uglify: {
            compress: {
                warnings: false
            },
            beautify: {
                ascii_only: true,
                beautify: true
            }
        },
        all: false,
        alias: {},
        paths: {},
        vars: {},
        map: [],
        exclude: [],
        connector: '\n'
    }, options)

    this.cacheSubfix = '?' + querystring.stringify(this.options)
    this.count = 0

    var alias = this.options.alias

    // If alias contains vars
    Object.keys(alias).forEach(function(id) {
        alias[id] = self.parseVars(alias[id])
    })
}

util.inherits(ModuleManager, EventEmitter)

_.assign(ModuleManager.prototype, {
    get: function(meta) {
        var self = this
        
        if (!meta || !meta.id || !meta.uri) {
            throw new TypeError('meta.id and meta.uri are required')
        }

        var id = this.parseId(meta.id)
        var uri = cmdTools.normalize(meta.uri)

        var key = uri + this.cacheSubfix
        promise = moduleCache[key]

        if (!promise) {
            module = new Module({
                id: id,
                uri: uri,
                code: meta.code,
                manager: this
            })

            moduleCache[key] = promise = module.build()
            
            promise.then(function () {
                self.count++
            })
        }

        return promise
    },
    parseId: function(id) {
        id = cmdTools.clearId(id)
        id = this.parseVars(id)
        id = this.parseAlias(id)
        return id
    },
    id2uri: function(id, baseUri) {

        id = this.parsePaths(id)
        var uri = cmdTools.addExtname(id)

        if (!baseUri) {
            if (rTopLevel.test(id)) {
                baseUri = this.options.base
            } else {
                baseUri = this.options.cwd
            }
        }

        uri = path.join(baseUri, uri)
        uri = this.parseMap(uri)

        return cmdTools.normalize(path.resolve(uri))
    },
    parseVars: function(id) {
        var vars = this.options.vars

        if (vars && id.indexOf("{") > -1) {
            id = id.replace(rVars, function(m, key) {
                return vars[key] ? vars[key] : m
            })
        }

        return id
    },
    parseAlias: function(id) {
        var alias = this.options.alias[id]
        return alias || id
    },
    parsePaths: function(id) {
        var paths = this.options.paths
        var m

        if (paths && (m = id.match(rPaths)) && paths[m[1]]) {
            id = paths[m[1]] + m[2]
        }

        return id
    },
    parseMap: function(uri) {
        var map = this.options.map
        var ret = uri

        if (map) {
            for (var i = 0, len = map.length; i < len; i++) {
                var rule = map[i]

                ret = typeof rule === 'function' ?
                    (rule(uri) || uri) :
                    uri.replace(rule[0], rule[1])

                if (ret !== uri) break
            }
        }

        return ret
    }
})

module.exports = ModuleManager
