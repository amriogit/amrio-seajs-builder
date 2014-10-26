var fs = require('fs'),
    path = require('path'),
    util = require('util')

var glob = require('glob')
var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')
var mkdirp = require('mkdirp')

function modify(ast, options) {
    
}

function testModify() {
    var file = fs.readFileSync('../test/assets/.tmp/amrio/tips/index.js')
}
