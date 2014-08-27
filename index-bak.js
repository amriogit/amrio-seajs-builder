#!/usr/bin/env node

(function(grunt){

    function switchENV(fn){
        var cwd = process.cwd()
        process.chdir(__dirname)
        var ret = fn()
        process.chdir(cwd)
        return ret
    }

    var program = require('commander'),
        style = require('grunt-cmd-transport').style

    var path = require('path'),
        util = require('util')

    var pkg = switchENV(function(){
        return grunt.file.readJSON('package.json')
    })

    program.version(pkg.version)
        .option('-b, --build [path]', '构建路径')
        .option('-d, --dist [path]', '部署路径', 'sea-modules')
        .option('-i, --include [option]', '构建包含范围', 'relative')
        .option('-m, --modules [path]', 'modules 路径', 'sea-modules')
        .option('--force', '强制执行')
        .parse(process.argv);

    grunt.option('force', program.force)

    var cwd = './',
        tmp = path.join(cwd, '.tmp'),
        tmpTransport = path.join(tmp, '.transport'),
        tmpConcat = path.join(tmp, '.concat'),
        modulePath = path.join(cwd, program.modules)

    var buildInput = program.build,
        buildOuput = program.dist,
        buildInclude = program.include

    var info = '-b=%s\n-p=%s\n-m=%s\n-i=%s\n'

    grunt.log.ok(util.format(info, buildInput, buildOuput, modulePath, buildInclude))

    buildInput || grunt.fatal('invalid -b(--build) option', 2)

    grunt.initConfig({
        clean: [tmp],
        copy: {
            'all': {
                files: [{
                    expand: true,
                    src: path.join(buildInput, '**'),
                    dest: buildOuput
                }]
            }
        },
        transport: {
            options: {
                debug: false
            },
            'build': {
                options: {
                    alias: {
                        jquery: 'jquery',
                        $: '$'
                    },
                    paths: [modulePath, 'sea-modules']
                },
                files: [{
                    expand: true,
                    src: path.join(buildInput, '**/*.{js,css,json,tpl,html,htm}'),
                    dest: tmpTransport
                }]
            },
            'build-css2js': {
                options: {
                    parsers: {
                        '.css': [style.init(grunt).css2jsParser]
                    }
                },
                files: [{
                    cwd: tmpTransport,
                    expand: true,
                    src: '**/*.css',
                    dest: tmpTransport
                }]
            }
        },
        concat: {
            options: {
                css2js: style.css2js
            },
            'pre-build': {
                options: {
                    paths: [tmpTransport, modulePath, 'sea-modules'],
                    include: buildInclude
                },
                files: [{
                    cwd: tmpTransport,
                    expand: true,
                    filter: 'isFile',
                    src: ['**/*.{js,css}', '!**/*{-debug,css}.*'],
                    dest: tmpConcat
                }]
            },
            'build': {
                options: {
                    paths: [tmpConcat, modulePath, 'sea-modules'],
                    include: buildInclude
                },
                files: [{
                    cwd: tmpTransport,
                    expand: true,
                    filter: 'isFile',
                    src: ['**/*.{js,css}', '!**/*{-debug,css}.*'],
                    dest: buildOuput
                }]
            }
        },
        uglify: {
            options: {
                mangle: {
                    except: ['$', 'jQuery']
                },
                banner: '/* build by amrio-seajs-builder <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n'
            },
            'build': {
                files: [{
                    cwd: buildOuput,
                    expand: true,
                    src: [path.join(buildInput, '**/*.js'), '!**/*-debug.*'],
                    dest: buildOuput
                }]
            }
        },
        cssmin: {
            'build': {
                cwd: buildOuput,
                expand: true,
                src: [path.join(buildInput, '**/*.css'), '!**/*-debug.*'],
                dest: buildOuput
            }
        }
    })
    
    switchENV(function(){
        grunt.loadNpmTasks('grunt-contrib-clean')
        grunt.loadNpmTasks('grunt-contrib-copy')
        grunt.loadNpmTasks('grunt-contrib-uglify')
        grunt.loadNpmTasks('grunt-contrib-cssmin')
        grunt.loadNpmTasks('grunt-cmd-transport')
        grunt.loadNpmTasks('grunt-cmd-concat')
    })

    grunt.registerTask('build', ['clean', 'copy', 'transport', 'concat', 'uglify', 'cssmin', 'clean'])
    grunt.registerTask('default', 'build')

    grunt.task.run('default')
    grunt.task.start()

})(require('grunt'))