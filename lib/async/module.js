var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')

function Module(options) {
    this.id = options.id
    this.uri = options.uri
    this.base = cmdTools.dirname(options.id)
    this.MM = options.MM
    this.originFactory = options.factory
    this.factory = null
    this.result = null
    this.isCmd = false
    this.remainDepIds = []
}

Module.prototype = {
    resolveNeedDepIds: function(depIds) {
        var onlyRel = this.MM.options.onlyRel
        var ignoreList = this.MM.options.ignore
        var base = this.base

        var ids = {}

        depIds.forEach(function(id) {
            if (id.indexOf('.') === 0) {
                id = cmdTools.join(base, id)
                ids[id] = true
            } else if (!onlyRel) {
                ids[id] = true
            }

            if (ignoreList.indexOf(id) > -1) {
                delete ids[id]
            }
        })

        return Object.keys(ids)
    },
    resolve: function(depIds) {
        var base = this.base

        var ids = {}

        depIds.forEach(function(id) {
            if (id.indexOf('.') === 0) {
                id = cmdTools.join(base, id)
                ids[id] = true
            }
            ids[id] = true
        })

        return Object.keys(ids)
    },
    getFactory: function() {
        return this.originFactory ? Promise.resolve(this.originFactory) : parsers.parse({
            id: this.id,
            uri: this.uri
        })
    },
    getDepModules: function(depIds) {
        var MM = this.MM
        var promises = depIds.map(function(id) {
            return MM.get({
                id: id
            })
        })
        return Promise.all(promises)
    },
    build: function() {
        var self = this
        var isMinify = this.MM.options.minify
        var factoryAst = null

        return this.getFactory().then(function(originFactory) {
            if (typeof originFactory === 'string') {
                factoryAst = cmdTools.getAst(originFactory)
                return cmdTools.parse(factoryAst)
            }

        }, function(err) {
            self.MM.emit('error', err)

        }).then(function(meta) {
            if (meta && meta.cmd) {
                self.isCmd = true
                self.remainDepIds = {}
                !(self.resolve(meta.deps) || []).forEach(function(id) {
                    self.remainDepIds[id] = true
                })
                return self.getDepModules(self.resolveNeedDepIds(meta.deps))
            }

        }).then(function(depModules) {

            var depFactories = null
            var depFactoriesCollection = {}

            function collectAllDepModules(modules) {
                var index
                modules.forEach(function(module) {
                    if (module.factory) {
                        depFactoriesCollection[module.uri] = module.factory

                        module.remainDepIds && module.remainDepIds.forEach(function(id) {
                            self.remainDepIds[id] = true
                        })

                        if (self.remainDepIds[module.id]) {
                            delete self.remainDepIds[module.id]
                        }
                    }

                    if (module.depModules && module.depModules.length) {
                        return collectAllDepModules(module.depModules)
                    }
                })
            }

            if (depModules) {
                collectAllDepModules(depModules)

                self.depModules = depModules

                depFactories = Object.keys(depFactoriesCollection).map(function(key) {
                    return depFactoriesCollection[key]
                })
            }

            return new Promise(function(resolve, reject) {
                self.remainDepIds = Object.keys(self.remainDepIds).map(function(key) {
                    return self.remainDepIds[key]
                })

                if (self.isCmd && factoryAst) {
                    factoryAst = cmdTools.transport(factoryAst, self.id, self.remainDepIds)
                }

                if (factoryAst) {
                    cmdTools.minify(factoryAst).then(function(factory) {
                        self.factory = factory
                        self.result = [factory].concat(depFactories).join(self.MM.options.footer)
                        resolve(self)
                    })
                } else {
                    resolve(self)
                }
            })
        })
    }
}

module.exports = Module
