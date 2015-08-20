var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')

var H = require('./helper')
var DataSet = require('./dataset')

function Module(options) {
    var manager = options.manager
    this.options = options

    this.id = options.id
    this.uri = options.uri
    this.code = options.code

    this.depModules = []
    this.remainsDepIds = []

    this.manager = manager
    this.managerOptions = manager.options
}

H.extend(Module.prototype, {
    resolve: function(originDepIds) {
        var manager = this.manager
        var isIncludeAllModules = this.managerOptions.all
        var excludeIdHandler = this.managerOptions.exclude
        
        var baseIdDir = cmdTools.dirname(this.id)
        var baseUriDir = cmdTools.dirname(this.uri)

        var concatMetas = []
        var deps = []

        originDepIds.forEach(function(id) {

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
                deps.push(id)
            }

            if (isExclude !== null && isExclude !== true) {
                concatMetas.push({
                    id: id,
                    uri: uri
                })
            }
        })

        return {
            deps: deps,
            concatMetas: concatMetas
        }
    },
    getCodeAst: function() {
        var promise = this.code !== undefined ? Promise.resolve(this.code) : parsers.parse(this)
        return promise.then(function(code) {
            return cmdTools.getAst(code)
        })
    },
    getDepModules: function(metas) {
        var self = this
        var moduleSet = new DataSet()

        var promises = metas.map(function(meta) {
            return self.manager.get(meta)
        })

        return Promise.all(promises).then(function(modules) {

            function walk(modules, second) {
                modules.forEach(function(module) {
                    module.code && moduleSet.add(module)
                    if (!second && module.depModules.length) {
                        return walk(module.depModules, true)
                    }
                })
            }

            walk(modules)

            return moduleSet.values()
        })
    },
    figureRemainsDepIds: function(deps, depModules) {
        var self = this
        var depsSet = new DataSet()

        deps.forEach(function(id) {
            depsSet.add(id)
        })

        depModules.forEach(function(module) {
            module.remainsDepIds.forEach(function(id) {
                depsSet.add(id)
            })
            if (depsSet.has(module.id)) {
                depsSet.delete(module.id)
            }
        })

        return depsSet.values()
    },
    concat: function(codeAst, remainsDepIds, depModules) {
        var options = this.managerOptions

        var transportedAst = cmdTools.transformCode(codeAst, this.id, remainsDepIds, this.manager)

        var code = cmdTools.minify(transportedAst, options.minify, options.uglify)

        var depModulesCodes = depModules.map(function(module) {
            return module.code
        })

        return {
            self: code,
            all: [code].concat(depModulesCodes).join(options.connector)
        }
    },
    build: function() {
        var self = this
        var codeAst = null
        var meta = null
        var isCmd = false
        var resolveDepIdsResult = {}
        var options = this.managerOptions

        return this.getCodeAst().then(function(result) {
            codeAst = result
            meta = cmdTools.parse(result)

            if (meta.id) {
                self.id = meta.id
            }
            
            isCmd = meta.cmd

            if (isCmd) {
                resolveDepIdsResult = self.resolve(meta.deps)
            }

        }).then(function() {
            return isCmd ? self.getDepModules(resolveDepIdsResult.concatMetas) : []

        }).then(function(depModules) {
            if (isCmd) {
                var remainsDepIds = self.figureRemainsDepIds(resolveDepIdsResult.deps, depModules)
                var concatResult = self.concat(codeAst, remainsDepIds, depModules)

                self.remainsDepIds = remainsDepIds
                self.depModules = depModules
                self.code = concatResult.self
                self.result = concatResult.all

            } else {
                self.code = self.result = cmdTools.minify(codeAst, options.minify, options.uglify)
            }

            return self

        }).catch(function(err) {
            console.log(err.stack)
            self.manager.emit('error', err)
            return self
        })
    }
})

module.exports = Module
