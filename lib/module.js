var Promise = require('bluebird')
var _ = require('lodash')
var chalk = require('chalk')

var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')

var STATUS = {
    ERROR: -1,
    READY: 0,
    FETCHED: 1,
    PARSE_META: 2,
    LOADED: 3,
    CONCATED: 4,
    BUILDED: 5
}

function Module(options) {
    this.options = options

    this.id = options.id
    this.uri = options.uri
    this.code = options.code || null
    this.result = null

    this.deps = []
    this.dependentModules = []

    this.status = STATUS.READY

    this.manager = options.manager
    this.mOptions = this.manager.options
}

_.assign(Module.prototype, {
    fetch: function() {

        if (typeof this.code === 'string') {
            return Promise.resolve(this.code)
        }

        return parsers.parse(this)
            .bind(this)
            .then(function(code) {
                this.code = code
                this.status = STATUS.FETCHED
            }).catch(function(err) {
                return Promise.reject(chalk.yellow('Not found module ') + chalk.red(this.id), 'warn')
            })
    },
    parseMeta: function() {
        this.ast = cmdTools.getAst(this.code)
        this.meta = cmdTools.parseMeta(this.ast)
        this.status = STATUS.PARSE_META
    },
    resolve: function() {
        var metas = []
        var isIncludeAllModules = this.mOptions.all
        var exclude = this.mOptions.exclude

        var baseId = cmdTools.dirname(this.id)
        var baseUri = cmdTools.dirname(this.uri)

        // Clear deps
        this.deps.length = 0

        _.forEach(this.meta.deps, function(originId) {

            var id = this.manager.parseId(originId)
            var uri = null
            var isExclude = false
            var isRelativeLevel = id.indexOf('.') === 0

            if (isRelativeLevel) {
                uri = this.manager.id2uri(id, baseUri)
                id = cmdTools.join(baseId, id)
            } else {
                uri = this.manager.id2uri(id)
            }

            if (!isRelativeLevel && !isIncludeAllModules) {
                isExclude = true

            } else if (_.isFunction(exclude)) {
                isExclude = exclude(id)

            } else if (_.isArray(exclude)) {
                isExclude = exclude.indexOf(id) > -1

            }

            if (isExclude !== null) {
                this.deps.push(id)
            }

            if (isExclude !== null && isExclude !== true) {
                metas.push({
                    id: id,
                    uri: uri
                })
            }
        }, this)

        return metas
    },
    load: function(metas) {
        var moduleMaps = {}

        var modulePromises = _.map(metas, this.manager.get, this.manager)

        return Promise.all(modulePromises).bind(this).then(function(modules) {

            function walker(modules, layer) {
                modules.forEach(function(module) {

                    if (module.status === STATUS.BUILDED) {
                        moduleMaps[module.uri] = module
                    }

                    if (layer === 1 && module.dependentModules.length) {
                        return walker(module.dependentModules)
                    }
                })
            }

            walker(modules, 1)
            this.status = STATUS.LOADED

            return this.dependentModules = _.values(moduleMaps)
        })
    },
    calcRemainsDeps: function() {
        var remains = []

        _.forEach(this.dependentModules, function(module) {
            _.pull(this.deps, module.id)
            remains = remains.concat(module.deps)
        }, this)

        this.deps = _.union(this.deps, remains)
    },
    concat: function() {

        var transformOptions = {
            id: this.id,
            deps: this.deps,
            alias: _.reduce(this.meta.deps, function(result, id) {
                result[id] = this.manager.parseId(id)
                return result
            }, {}, this)
        }

        this.ast = cmdTools.transformCode(this.ast, transformOptions)

        this.code = this.minify()

        var dependentModuleCodes = _.map(this.dependentModules, 'code')

        this.result = [this.code].concat(dependentModuleCodes).join(this.mOptions.connector)
        this.status = STATUS.CONCATED
    },
    build: function() {

        return this.fetch()
            .bind(this)
            .then(function(code) {

                this.parseMeta()

                if (this.meta.cmd && this.meta.untransform) {

                    return this.load(this.resolve())
                        .bind(this).then(function() {
                            this.calcRemainsDeps()
                            this.concat()
                        })

                } else {
                    this.code = this.result = this.minify()
                }

            }).then(function() {
                this.status = STATUS.BUILDED
                return this

            }, function(info, type) {
                this.status = STATUS.ERROR
                this.manager.emit(type || 'error', info)
                return this
            })
    },
    minify: function() {
        var mOptions = this.mOptions

        var uglifyOptions = _.clone(mOptions.uglify)

        if (mOptions.minify) {

            delete uglifyOptions.beautify.beautify

            if (this.meta.minified) {
                return cmdTools.beautify(this.ast, true)
            }

            return cmdTools.minify(this.ast, uglifyOptions)

        } else {
            return cmdTools.beautify(this.ast)
        }

    }
})

module.exports = Module
