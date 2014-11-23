'use strict'
var fs = require('fs'),
    path = require('path'),
    util = require('util')

var cmd = require('cmd-util')
var UglifyJS = require('uglify-js')

var helper = require('./helper')

module.exports = {
    data: {
        base: './',
        alias: {},
        paths: {}
    },
    config: function(options) {
        helper.extend(this.data, options)
    }
}