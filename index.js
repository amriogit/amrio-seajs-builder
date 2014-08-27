#!/usr/bin/env node

var program = require('commander')
var grunt = require('grunt')
var taskMain = require('./lib/task-main')

var pkg = (function() {
    var cwd = process.cwd()
    process.chdir(__dirname)
    var json = grunt.file.readJSON('package.json')
    process.chdir(cwd)
    return json
})()

program.version(pkg.version)
    .option('--input [path]', '构建路径')
    .option('--output [path]', '部署路径', 'sea-modules')
    .option('--include [option]', '构建包含范围', 'relative')
    .option('--paths [path]', 'paths 路径')
    .parse(process.argv)

console.log('\ninput=%s\noutput=%s\ninclude=%s\npaths=%s\n', program.input, program.output, program.include, program.paths)

taskMain(grunt, program.input, program.output, program.include, program.paths)
