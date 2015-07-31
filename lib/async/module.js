var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')

var H = require('../helper')
var DataSet = require('./dataset')

function Module(options) {
    var manager = options.manager
    this.options = options

    this.id = options.id
    this.uri = options.uri
    this.base = cmdTools.dirname(this.id)
    this.code = options.code

    this.depModules = []
    this.remainsDepIds = []

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
        var concatIds = new DataSet()
        var ids = new DataSet()

        originDepIds.forEach(function(id) {
            var isRelative = id.indexOf('.') === 0
            var isExclude = false

            if (isRelative) {
                id = cmdTools.join(base, id)
            }

            ids.add(id)
            concatIds.add(id)

            if (!isRelative && !includeAll) {
                isExclude = true
            } else if (typeof exclude === 'function') {
                isExclude = exclude(id)
            } else if (Array.isArray(exclude)) {
                isExclude = exclude.indexOf(id) > -1
            }

            if (isExclude === null) {
                ids.delete(id)
            }

            if (isExclude || isExclude === null) {
                concatIds.delete(id)
            }
        })

        return {
            ids: ids.values(),
            concatIds: concatIds.values()
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
        var moduleSet = new DataSet()

        var promises = depIds.map(function(id) {
            return self.manager.get({
                id: id
            })
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
            depsSet.add(self.manager.parseAlias(id))
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
        var transportedAst = cmdTools.transport(codeAst, this.id, remainsDepIds)
        var code = cmdTools.minify(transportedAst, this.managerOptions)

        var depModulesCodes = depModules.map(function(module) {
            return module.code
        })

        return {
            self: code,
            all: [code].concat(depModulesCodes).join(this.managerOptions.connector)
        }
    },
    build: function() {
        var self = this
        var codeAst = null
        var meta = null
        var isCmd = false
        var resolveDepIdsResult = {}

        return this.getCodeAst().then(function(ast) {
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
                var remainsDepIds = self.figureRemainsDepIds(resolveDepIdsResult.ids, depModules)
                var concatResult = self.concat(codeAst, remainsDepIds, depModules)

                self.remainsDepIds = remainsDepIds
                self.depModules = depModules
                self.code = concatResult.self
                self.result = concatResult.all

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
