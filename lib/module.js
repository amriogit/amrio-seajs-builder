var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')

var H = require('./helper')
var DataSet = require('./dataset')

function Module(options) {
    this.options = options

    this.id = options.id
    this.uri = options.uri
    this.code = options.code
    this.result = null
    this.deps = []
    this.dependentModules = []

    this.manager = options.manager
    this.mOptions = this.manager.options
}

H.extend(Module.prototype, {
    fetch: function() {
        var self = this
        var promise = typeof this.code === 'string' ? Promise.resolve(this.code) : parsers.parse(this)

        return promise.then(function(code) {
            self.code = code
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
        var excludeIdHandler = this.mOptions.exclude

        var baseIdDir = cmdTools.dirname(this.id)
        var baseUriDir = cmdTools.dirname(this.uri)

        this.meta.deps.forEach(function(id) {

            var isRelativeLevelId = id.indexOf('.') === 0
            var isExclude = false
            var uri = null

            id = manager.parseId(id)

            if (isRelativeLevelId) {
                uri = manager.id2uri(id, baseUriDir)
                id = cmdTools.join(baseIdDir, id)
            } else {
                uri = manager.id2uri(id)
            }

            if (!isRelativeLevelId && !isIncludeAllModules) {
                isExclude = true

            } else if (typeof excludeIdHandler === 'function') {
                isExclude = excludeIdHandler(id)

            } else if (Array.isArray(excludeIdHandler)) {
                isExclude = excludeIdHandler.indexOf(id) > -1

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

        return Promise.all(modulePromises).then(function(modules) {

            var module = null
            var childrenModule = null

            for (var i = 0; i < modules.length; i++) {
                module = modules[i]
                module.code && moduleSet.add(module)

                if (module.dependentModules.length) {

                    for (var j = 0; j < module.dependentModules.length; j++) {
                        childrenModule = module.dependentModules[j]
                        childrenModule.code && moduleSet.add(childrenModule)
                    }

                }
            }

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

        }, function(err) {
            self.manager.emit('error', err)
            return self
        })
    }
})

module.exports = Module
