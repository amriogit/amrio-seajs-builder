var assert = require('assert')
var fs = require('fs')
var asb = require('../index')

describe('amrio-seajs-builder usage', function() {

    it('clean', function() {
        asb.clean({
            src: ['./dist', './build']
        })
        assert.ok(!fs.existsSync('./dist'), 'clean dist')
    })

    it('transport amrio', function() {
        asb.transport({
            cwd: './',
            src: 'amrio/**/*.{js,css,tpl}',
            dest: './dist/transport',
            paths: ['./']
        })
    })

    it('concat amrio', function() {
        asb.concat({
            cwd: './dist/transport',
            src: 'amrio/**/*.*',
            dest: './dist/concat',

            include: 'all',
            paths: ['./dist/transport']
        })
    })

    it('transport biz', function() {
        asb.transport({
            cwd: './',
            src: 'biz/**/*.{js,css,tpl}',
            dest: './dist/transport',
            paths: ['./', './dist/concat/amrio']
        })
    })

    it('concat biz all', function() {
        asb.concat({
            cwd: './dist/transport',
            src: 'biz/**/*.*',
            dest: './dist/concat',

            include: 'all',
            paths: ['./dist/transport']
        })
    })

    it('uglify biz and amrio', function() {
        asb.uglify({
            cwd: './dist/concat',
            src: '**/*.js',
            dest: './dist/concat',
            mangle: {},
            banner: ''
        })
    })

    it('cssmin biz and amrio', function() {
        asb.cssmin({
            cwd: './dist/concat',
            src: '**/*.css',
            dest: './dist/concat'
        })
    })

    it('copy', function() {
        asb.copy({
            cwd: './dist/concat',
            src: ['**/*.*', '!**/*-debug.*'],
            dest: './build/'
        })
    })

    it('clean', function() {
        asb.clean({
            src: ['./dist'],
        })
    })
})