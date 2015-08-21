var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')
var chalk = require('chalk')

var H = require('./helper')
var DataSet = require('./dataset')

function Module(options) {
    this.options = options

    this.id = options.id
    this.uri = options.uri
    this.code = options.code || null
    this.result = null
    this.deps = []
    this.dependentModules = []

    this.manager = options.manager
    this.mOptions = this.manager.options
}

H.extend(Module.prototype, {
    fetch: function() {
        var self = this
        return new Promise(function (resolve, reject) {

            var promise = typeof self.code === 'string' ? Promise.resolve(self.code) : parsers.parse(self)

            promise.then(function(code) {
                self.code = code
                resolve()
            }).catch(function (err) {
                reject('Not Found Module ' + chalk.red(self.id), 'warn')
            })
        })
    },
    parseMeta: function() {
        this.ast = cmdTools.getAst(this.code)
        this.meta = cmdTools.parseMeta(this.ast)
    },
    resolve: function() {
        var self = this
        var metas = []

        var manager = this.manager
        var isIncludeAllModules = this.mOptions.all
        var exclude = this.mOptions.exclude

        var baseIdDir = cmdTools.dirname(this.id)
        var baseUriDir = cmdTools.dirname(this.uri)

        this.meta.deps.forEach(function(id) {

            var uri = null
            var isExclude = false
            var isRelativeLevel = id.indexOf('.') === 0

            id = manager.parseId(id)

            if (isRelativeLevel) {
                uri = manager.id2uri(id, baseUriDir)
                id = cmdTools.join(baseIdDir, id)
            } else {
                uri = manager.id2uri(id)
            }

            if (!isRelativeLevel && !isIncludeAllModules) {
                isExclude = true

            } else if (typeof exclude === 'function') {
                isExclude = exclude(id)

            } else if (Array.isArray(exclude)) {
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
                module.code && moduleSet.add(module)
                if (layer === 1 && module.dependentModules.length) {
                    walker(module.dependentModules)
                }
            })
        }

        return Promise.all(modulePromises).then(function(modules) {
            walker(modules, 1)
            return self.dependentModules = moduleSet.values()
        })
    },
    calcRemainsDeps: function() {
        var self = this

        var remains = this.dependentModules.map(function(module) {
            H.arrayRemove(self.deps, module.id)
            return module.deps
        }).reduce(function(array, deps) {
            return array.concat(deps)
        }, [])

        this.deps = H.unique(this.deps.concat(remains))
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

        this.code = cmdTools.minify(this.ast, this.mOptions.minify, this.mOptions.uglify)

        var dependentModuleCodes = this.dependentModules.map(function(module) {
            return module.code
        })

        this.result = [this.code].concat(dependentModuleCodes).join(this.mOptions.connector)
    },
    build: function() {
        var self = this

        return this.fetch().then(function(code) {
            self.parseMeta()

            if (self.meta.cmd) {

                return self.load(self.resolve()).then(function() {
                    self.calcRemainsDeps()
                    self.concat()
                })

            } else {
                self.code = self.result = cmdTools.minify(self.ast, self.mOptions.minify, self.mOptions.uglify)
            }

        }).then(function() {
            return self

        }, function(info, type) {
            self.manager.emit(type || 'error', info)
            return self
        })
    }
})

module.exports = Module
