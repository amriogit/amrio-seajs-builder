var path = require('path')
var util = require('util')
var querystring = require('querystring')
var EventEmitter = require('events').EventEmitter
var Module = require('./module')
var cmdTools = require('./cmd-tools')
var H = require('../helper')

var PATHS_RE = /^([^/:]+)(\/.+)$/
var VARS_RE = /{([^{]+)}/g

var cache = {}

function ModuleManager(options) {
    EventEmitter.call(this)

    var self = this

    this.options = H.extend({
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
    this.cache = cache

    var alias = this.options.alias

    Object.keys(alias).forEach(function(id) {
        alias[id] = self.parseVars(alias[id])
    })
}

util.inherits(ModuleManager, EventEmitter)

H.extend(ModuleManager.prototype, {
    get: function(meta) {
        var id = this.parseId(meta.id)
        var uri = meta.uri
        var module = null
        var key = null
        var promise = null

        if (!id) {
            throw new TypeError('meta.id is required')
        }

        if (!uri) {
            uri = cmdTools.id2uri(this.id2uri(id), this.options.base, this.options.cwd)
        }

        uri = this.parseMap(uri)

        key = uri + this.cacheSubfix
        promise = this.cache[key]

        if (!promise) {
            module = new Module({
                id: id,
                uri: uri,
                code: meta.code,
                manager: this
            })

            this.cache[key] = promise = module.build()
        }

        return promise
    },
    parseId: function(id) {
        id = this.parseAlias(id)
        id = this.parseVars(id)
        return id
    },
    id2uri: function(id) {
        return this.parseMap(this.parsePaths(id))
    },
    parseAlias: function(id) {
        var alias = this.options.alias[id]
        return alias || id
    },
    parsePaths: function(id) {
        var paths = this.options.paths
        var m

        if (paths && (m = id.match(PATHS_RE)) && paths[m[1]]) {
            id = paths[m[1]] + m[2]
        }

        return id
    },
    parseVars: function(id) {
        var vars = this.options.vars

        if (vars && id.indexOf("{") > -1) {
            id = id.replace(VARS_RE, function(m, key) {
                return vars[key] ? vars[key] : m
            })
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
