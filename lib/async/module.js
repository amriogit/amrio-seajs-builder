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
}

Module.prototype = {
    resolve: function(depIds) {
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

        }).then(function(meta) {
            if (meta && meta.cmd) {
                factoryAst = cmdTools.transport(factoryAst, self.id, meta.deps)
                return self.getDepModules(self.resolve(meta.deps))
            }

        }).then(function(depModules) {

            var depFactories = null
            var depFactoriesCollection = {}

            function find(modules) {
                modules.forEach(function(module) {
                    depFactoriesCollection[module.uri] = module.factory
                    if (module.depModules && module.depModules.length) {
                        find(module.depModules)
                    }
                })
            }

            if (depModules) {
                self.depModules = depModules
                
                find(depModules)

                depFactories = Object.keys(depFactoriesCollection).map(function(key) {
                    return depFactoriesCollection[key]
                }).filter(function(factory) {
                    return factory
                })
            }

            return new Promise(function(resolve, reject) {
                if (factoryAst) {
                    cmdTools.minify(factoryAst.print_to_string()).then(function(factoryMinify) {
                        self.factory = factoryMinify
                        self.result = [factoryMinify].concat(depFactories).join(self.MM.options.footer)
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
