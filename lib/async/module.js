var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')
var H = require('../helper')

function Module(options) {
    var manager = options.manager
    this.options = options

    this.id = options.id
    this.uri = options.uri
    this.base = cmdTools.dirname(this.id)
    this.code = options.code

    this.depModules = []
    this.remainDepIds = []

    this.manager = manager
    this.managerOptions = manager.options
}

H.extend(Module.prototype, {
    resolve: function(originDepIds) {
        var self = this
        var manager = this.manager
        var includeAll = this.managerOptions.all
        var exclude = this.managerOptions.exclude
        var base = this.base
        var concatIds = {}
        var ids = {}

        originDepIds.forEach(function(id) {
            var isRelative = id.indexOf('.') === 0
            var isExclude = null

            if (isRelative) {
                id = cmdTools.join(base, id)
            }

            ids[id] = true
            concatIds[id] = true

            if (!isRelative && !includeAll) {
                isExclude = true
            } else if (typeof exclude === 'function') {
                isExclude = exclude(id)
            } else if (Array.isArray(exclude)) {
                isExclude = exclude.indexOf(id) > -1
            }

            if (isExclude === null) {
                delete ids[id]
            }

            if (isExclude || isExclude === null) {
                delete concatIds[id]
            }
        })

        return {
            ids: Object.keys(ids),
            concatIds: Object.keys(concatIds)
        }
    },
    getCodeAst: function() {
        var promise = this.options.code ? Promise.resolve(this.options.code) : parsers.parse(this)
        return promise.then(function(code) {
            return cmdTools.getAst(code)
        })
    },
    parseMeta: function(codeAst) {
        return cmdTools.parse(codeAst)
    },
    getDepModules: function(depIds) {
        var self = this
        var moduleCollection = {}

        var promises = depIds.map(function(id) {
            return self.manager.get({
                id: id
            })
        })

        function walk(modules, second) {
            modules.forEach(function(module) {
                module.code && (moduleCollection[module.uri] = module)
                if (!second && module.depModules && module.depModules.length) {
                    return walk(module.depModules, true)
                }
            })
        }

        return Promise.all(promises).then(function(treeLikeModules) {
            walk(treeLikeModules)
            return Object.keys(moduleCollection).map(function(key) {
                return moduleCollection[key]
            })
        })
    },
    calcRemainDepIds: function(deps, depModules) {
        var self = this
        var depsCollection = {}

        deps.forEach(function(id) {
            depsCollection[self.manager.parseAlias(id)] = true
        })

        depModules.forEach(function(module) {
            module.remainDepIds.forEach(function(id) {
                depsCollection[id] = true
            })

            if (depsCollection[module.id]) {
                delete depsCollection[module.id]
            }
        })

        return Object.keys(depsCollection)
    },
    concat: function(codeAst, remainDepIds, depModules) {
        codeAst = cmdTools.transport(codeAst, this.id, remainDepIds)

        var code = cmdTools.minify(codeAst, this.managerOptions)

        var depModulesCodes = depModules.map(function(module) {
            return module.code
        })

        return {
            code: code,
            result: [code].concat(depModulesCodes).join(this.managerOptions.connector)
        }
    },
    build: function() {
        var self = this
        var codeAst = null
        var meta = null
        var isCmd = false
        var resolveDepIdsResult = {}

        return this.getCodeAst()
            .then(function(ast) {
                codeAst = ast
                meta = self.parseMeta(ast)
                isCmd = meta.cmd

                if (isCmd) {
                    resolveDepIdsResult = self.resolve(meta.deps)
                }

            }).then(function() {
                return isCmd ? self.getDepModules(resolveDepIdsResult.concatIds) : []

            }).then(function(depModules) {
                if (isCmd) {
                    var remainDepIds = self.calcRemainDepIds(resolveDepIdsResult.ids, depModules)
                    var concatAssets = self.concat(codeAst, remainDepIds, depModules)

                    self.remainDepIds = remainDepIds
                    self.depModules = depModules
                    self.code = concatAssets.code
                    self.result = concatAssets.result

                } else {
                    self.code = self.result = cmdTools.minify(codeAst, self.manager.options)
                }

                return self

            }).catch(function(err) {
                self.manager.emit('error', err)
                return self
            })
    }
})
module.exports = Module
