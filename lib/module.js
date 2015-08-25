var _ = require('lodash')
var chalk = require('chalk')

var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')
var DataSet = require('./dataset')

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
        var self = this
        return new Promise(function(resolve, reject) {

            var promise = typeof self.code === 'string' ? Promise.resolve(self.code) : parsers.parse(self)

            promise.then(function(code) {
                self.code = code
                self.status = STATUS.FETCHED
                resolve()
            }).catch(function(err) {
                reject(chalk.yellow('Not found module ') + chalk.red(self.id), 'warn')
            })
        })
    },
    parseMeta: function() {
        this.ast = cmdTools.getAst(this.code)
        this.meta = cmdTools.parseMeta(this.ast)
        this.status = STATUS.PARSE_META
    },
    resolve: function() {
        var self = this
        var metas = []

        var manager = this.manager
        var isIncludeAllModules = this.mOptions.all
        var exclude = this.mOptions.exclude

        var baseId = cmdTools.dirname(this.id)
        var baseUri = cmdTools.dirname(this.uri)

        // Clear deps
        this.deps.length = 0

        this.meta.deps.forEach(function(originId) {

            var id = manager.parseId(originId)
            var uri = null
            var isExclude = false
            var isRelativeLevel = id.indexOf('.') === 0

            if (isRelativeLevel) {
                uri = manager.id2uri(id, baseUri)
                id = cmdTools.join(baseId, id)
            } else {
                uri = manager.id2uri(id)
            }

            if (!isRelativeLevel && !isIncludeAllModules) {
                isExclude = true

            } else if (_.isFunction(exclude)) {
                isExclude = exclude(id)

            } else if (_.isArray(exclude)) {
                isExclude = exclude.indexOf(id) > -1

            }

            if (isExclude !== null) {
                self.deps.push(id)
            }

            if (isExclude !== null && isExclude !== true) {
                metas.push({
                    id: id,
                    uri: uri
                })
            }
        })

        return metas
    },
    load: function(metas) {
        var self = this
        var moduleSet = new DataSet()

        var modulePromises = metas.map(function(meta) {
            return self.manager.get(meta)
        })

        function walker(modules, layer) {
            modules.forEach(function(module) {
                module.status === STATUS.BUILDED && moduleSet.add(module)
                if (layer === 1 && module.dependentModules.length) {
                    walker(module.dependentModules)
                }
            })
        }

        return Promise.all(modulePromises).then(function(modules) {
            walker(modules, 1)
            self.status = STATUS.LOADED
            return self.dependentModules = moduleSet.values()
        })
    },
    calcRemainsDeps: function() {
        var deps = this.deps
        var remains = []

        this.dependentModules.forEach(function(module) {
            _.pull(deps, module.id)
            remains = remains.concat(module.deps)
        })

        this.deps = _.union(deps, remains)
    },
    concat: function() {
        var self = this

        var transformOptions = {
            id: this.id,
            deps: this.deps,
            alias: this.meta.deps.reduce(function(alias, id) {
                alias[id] = self.manager.parseId(id)
                return alias
            }, {})
        }

        this.ast = cmdTools.transformCode(this.ast, transformOptions)

        this.code = this.minify()

        var dependentModuleCodes = this.dependentModules.map(function(module) {
            return module.code
        })

        this.result = [this.code].concat(dependentModuleCodes).join(this.mOptions.connector)
        this.status = STATUS.CONCATED
    },
    build: function() {
        var self = this

        return this.fetch().then(function(code) {
            self.parseMeta()

            if (self.meta.cmd && self.meta.untransform) {

                return self.load(self.resolve()).then(function() {
                    self.calcRemainsDeps()
                    self.concat()
                })

            } else {
                self.code = self.result = self.minify()
            }

        }).then(function() {
            self.status = STATUS.BUILDED
            return self

        }, function(info, type) {
            self.status = STATUS.ERROR
            self.manager.emit(type || 'error', info)
            return self
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
