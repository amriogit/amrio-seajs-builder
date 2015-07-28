var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')
var H = require('../helper')

function Module(options) {
    this.options = options
    this.id = options.id
    this.uri = options.uri
    this.base = cmdTools.dirname(options.id)
    this.MM = options.MM
    this.code = options.factory
    this.depModules = []
    this.remainDepIds = []
}

H.extend(Module.prototype, {
    resolveNeedDepIds: function(depIds) {
        var MM = this.MM
        var includeAll = MM.options.all
        var exclude = MM.options.exclude
        var base = this.base
        var ids = {}

        depIds.forEach(function(id) {
            var isRelative = id.indexOf('.') === 0

            if (isRelative) {
                id = cmdTools.join(base, id)
                ids[id] = true
            } else if (includeAll) {
                ids[id] = true
            }

            var isExclude = null

            if (typeof exclude === 'function') {
                isExclude = exclude(id)
            } else if (Array.isArray(exclude)) {
                isExclude = exclude.indexOf(id) > -1
            }

            if (isExclude) {
                delete ids[id]
            }
        })

        return Object.keys(ids)
    },
    resolveDepIds: function(depIds) {
        var self = this
        var base = this.base
        var ids = {}

        depIds.forEach(function(id) {
            if (id.indexOf('.') === 0) {
                id = cmdTools.join(base, id)
            }
            ids[id] = true
        })

        return Object.keys(ids)
    },
    getCodeAst: function() {
        var promise = this.options.code ? Promise.resolve(this.options.code) : parsers.parse(this)
        return promise.then(function(code) {
            return cmdTools.getAst(code)
        })
    },
    parseMeta: function(codeAst) {
        var self = this
        var meta = cmdTools.parse(codeAst)

        if (meta && meta.cmd && meta.deps) {
            meta.resolveDeps = this.resolveDepIds(meta.deps)
        }

        return meta
    },
    getDepModules: function(depIds) {
        var self = this
        var moduleCollection = {}

        var promises = this.resolveNeedDepIds(depIds).map(function(id) {
            return self.MM.get({
                id: id
            })
        })

        function flatTreeLikeModules(modules, secondFloor) {
            modules.forEach(function(module) {
                module.code && (moduleCollection[module.uri] = module)
                if (!secondFloor && module.depModules && module.depModules.length) {
                    return flatTreeLikeModules(module.depModules, true)
                }
            })
            moduleCollection
        }

        return Promise.all(promises).then(function(treeLikeModules) {
            flatTreeLikeModules(treeLikeModules)
            return Object.keys(moduleCollection).map(function (key) {
                return moduleCollection[key]
            }) 
        })
    },
    calcRemainDepIds: function(deps, depModules) {
        depModules.forEach(function(module) {
            deps = H.unique(deps.concat(module.remainDepIds))
            var index = deps.indexOf(module.id)
            index > -1 && deps.splice(index, 1)
        })
        return deps
    },
    concat: function(codeAst, meta, remainDepIds, depModules) {
        if (meta.cmd) {
            codeAst = cmdTools.transport(codeAst, this.id, remainDepIds)
        }

        var code = cmdTools.minify(codeAst, this.MM.options)

        var depCodes = depModules.map(function(module) {
            return module.code
        })

        return {
            code: code,
            result: [code].concat(depCodes).join(this.MM.options.connector)
        }
    },
    build: function() {
        var self = this
        var codeAst = null
        var meta = null

        return this.getCodeAst()
            .then(function(ast) {
                codeAst = ast
                self.meta = meta = self.parseMeta(codeAst)

            }).then(function () {
                return meta.cmd ? self.getDepModules(meta.deps) : []

            }).then(function (depModules) {
                if (meta.cmd) {
                    var remainDepIds = self.calcRemainDepIds(meta.resolveDeps, depModules)
                    var concatAssets = self.concat(codeAst, meta, remainDepIds, depModules)

                    self.remainDepIds = remainDepIds
                    self.depModules = depModules
                    self.code = concatAssets.code
                    self.result = concatAssets.result
                } else {
                    self.code = self.result = cmdTools.minify(codeAst, self.MM.options)
                }

                return self
            })
            .catch(function(err) {
                self.MM.emit('error', err)
                return self
            })
    }
})
module.exports = Module
