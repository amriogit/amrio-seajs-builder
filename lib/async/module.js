var cmdTools = require('./cmd-tools')
var parsers = require('./parsers')
var H = require('../helper')

function Module(options) {
    this.id = options.id
    this.uri = options.uri
    this.base = cmdTools.dirname(options.id)
    this.MM = options.MM
    this.originFactory = options.factory
    this.factory = null
    this.result = null
    this.isCmd = false
    this.depModules = []
    this.remainDepIds = {}
}

H.extend(Module.prototype, {
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
    getSource: function() {
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

        function getDepModules(source) {

        }

        return this.getSource()
            .then(getDepModules)
            .then(self.concat.bind(self))
            .catch(function(err) {
                self.MM.emit('error', err)
            })
    },
    transport: function(source) {
        return new Promise(function(resolve, reject) {
            var factoryAst = cmdTools.getAst(source)
            var meta = cmdTools.parse(factoryAst)

            self.isCmd = meta.cmd

            if (meta && meta.cmd) {

                self.resolve(meta.deps).forEach(function(id) {
                    self.remainDepIds[id] = true
                })

                self.getDepModules(self.resolveNeedDepIds(meta.deps)).then(function(depModules) {
                    resolve(factoryAst, self.findAllDepModules(depModules))
                })
            } else {
                resolve(factoryAst, [])
            }
        })
    },
    concat: function(factoryAst, flatModules) {
        var self = this

        var depFactories = flatModules.map(function(module) {
            var index = self.remainDepIds.indexOf(module)
            index > -1 && self.remainDepIds.splice(index, 1)
            return module.factory
        })

        if (self.isCmd) {
            factoryAst = cmdTools.transport(factoryAst, self.id, self.remainDepIds)
        }

        return cmdTools.minify(factoryAst).then(function(factory) {
            self.factory = factory
            self.result = [factory].concat(depFactories).join(self.MM.options.footer)
            return self
        })
    },
    findAllDepModules: function(modules) {
        var self = this
        var moduleCollection = {}

        modules.forEach(function(module) {
            moduleCollection[module.uri] = module
            if (module.depModules && module.depModules.length) {
                return self.findAllDepModules(module.depModules)
            }
        })

        return Object.keys(moduleCollection).map(function(key) {
            return moduleCollection[key]
        })
    }

})
module.exports = Module
