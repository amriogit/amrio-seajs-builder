#!/usr/bin/env node

function builder(grunt){

    // 外部模块
    var program = require('commander'),
        style = require('grunt-cmd-transport').style

    var path = require('path'),
        util = require('util')

    program.version('0.0.1')
        .option('--force', '强制执行')
        .option('-b, --build [path]', '构建路径，必填项！', '')
        .option('-d, --dist [path]', '部署路径，默认值: sea-modules', 'sea-modules')
        .option('-i, --include [option]', '构建包含范围: self, relative, all；默认值: relative', 'relative')
        .option('-p, --paths [path]', 'paths 路径，默认值: sea-modules', 'sea-modules')
        .parse(process.argv);

    grunt.option('force', program.force)

    var cwd = './',
        tmp = path.join(cwd, '.tmp'),
        modulePath = path.join(cwd, program.paths)

    var buildInput = program.build,
        buildOuput = program.dist,
        buildInclude = program.include

    var info = '构建路径 -b=%s\n部署路径 -p=%s\npaths 路径 -m=%s\n构建范围 -i=%s\n'

    grunt.log.ok(util.format(info, buildInput, buildOuput, modulePath, buildInclude))

    buildInput || grunt.fatal('构建路径出错！', 2)

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
                    paths: [buildInput, modulePath, cwd, 'sea-modules']
                },
                files: [{
                    expand: true,
                    src: path.join(buildInput, '**/*.{js,css,json,tpl,html,htm}'),
                    dest: tmp
                }]
            },
            'build-css2js': {
                options: {
                    parsers: {
                        '.css': [style.init(grunt).css2jsParser]
                    }
                },
                files: [{
                    cwd: tmp,
                    expand: true,
                    src: '**/*.css',
                    dest: tmp
                }]
            }
        },
        concat: {
            options: {
                css2js: style.css2js,
                paths: [tmp, modulePath, 'sea-modules']
            },
            'build': {
                options: {
                    include: buildInclude
                },
                files: [{
                    cwd: tmp,
                    expand: true,
                    filter: 'isFile',
                    src: ['**'],
                    dest: buildOuput
                }]
            }
        },
        uglify: {
            options: {
                mangle: {
                    except: ['$', 'jQuery']
                }
            },
            'build': {
                files: [{
                    cwd: buildOuput,
                    expand: true,
                    src: [path.join(buildInput, '**/*.js'), '!**/*-debug.js'],
                    dest: buildOuput
                }]
            }
        },
        cssmin: {
            'build': {
                cwd: buildOuput,
                expand: true,
                src: [path.join(buildInput, '**/*.css'), '!**/*-debug.css'],
                dest: buildOuput
            }
        }
    })
    
    // 切换目录，避免加载不到插件
    !function(){
        var cwd = process.cwd()
        process.chdir(__dirname)
        grunt.loadNpmTasks('grunt-contrib-clean')
        grunt.loadNpmTasks('grunt-contrib-copy')
        grunt.loadNpmTasks('grunt-contrib-uglify')
        grunt.loadNpmTasks('grunt-contrib-cssmin')
        grunt.loadNpmTasks('grunt-cmd-transport')
        grunt.loadNpmTasks('grunt-cmd-concat')
        process.chdir(cwd)
    }()

    grunt.registerTask('build', ['clean', 'copy', 'transport', 'concat', 'uglify', 'cssmin', 'clean'])
    grunt.registerTask('default', 'build')

    grunt.task.run('default')
    grunt.task.start()
}

builder(require('grunt'))