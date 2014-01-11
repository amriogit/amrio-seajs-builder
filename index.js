#!/usr/bin/env node

function builder(grunt){

    // 外部模块
    var program = require('commander'),
        style = require('grunt-cmd-transport').style

    var path = require('path'),
        util = require('util')

    program.version('0.0.1')
        .option('-b, --build [path]', '构建路径，必填项！', '')
        .option('-d, --dist [path]', '部署路径，默认值: sea-modules', 'sea-modules')
        .option('-i --include [option]', '构建包含范围: self, relative, all；默认值: relative', 'relative')
        .parse(process.argv);

    var cwd = './',
        tmp = path.join(cwd, '.tmp'),
        modulePath = path.join(cwd, './sea-modules')

    var buildInput = program.build,
        buildOuput = program.dist,
        buildInclude = program.include

    var info = '构建路径 -b=%s\n部署路径 -d=%s\n构建范围 -i=%s\n'

    grunt.log.ok(util.format(info, buildInput, buildOuput, buildInclude))

    buildInput || grunt.fatal('构建路径出错！', 2)

    var paths = [tmp, modulePath, buildOuput, cwd]

    grunt.initConfig({
        clean: [tmp, path.join(buildOuput, buildInput)],
        transport: {
            'build': {
                options: {
                    alias: {
                        jquery: 'jquery',
                        $: '$'
                    },
                    paths: paths
                },
                files: [{
                    expand: true,
                    filter: 'isFile',
                    src: path.join(buildInput, '**'),
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
                    filter: 'isFile',
                    src: path.join(buildInput, '**/*.css'),
                    dest: tmp
                }]
            }
        },
        concat: {
            options: {
                css2js: style.css2js,
                paths: paths
            },
            'build': {
                options: {
                    include: buildInclude
                },
                files: [{
                    cwd: path.join(tmp, buildInput),
                    expand: true,
                    filter: 'isFile',
                    src: ['**', '!**/*.css.js'],
                    dest: path.join(buildOuput, buildInput)
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
                    cwd: path.join(buildOuput, buildInput),
                    expand: true,
                    filter: 'isFile',
                    src: ['**/*.js', '!**/*{debug.js,.css.js,.tpl.js}'],
                    dest: path.join(buildOuput, buildInput)
                }]
            }
        },
        cssmin: {
            'build': {
                cwd: path.join(buildOuput, buildInput),
                expand: true,
                filter: 'isFile',
                src: ['**/*.css', '!**/*-debug.css'],
                dest: path.join(buildOuput, buildInput)
            }
        }
    })

    grunt.loadNpmTasks('grunt-contrib-clean')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-cssmin')
    grunt.loadNpmTasks('grunt-cmd-transport')
    grunt.loadNpmTasks('grunt-cmd-concat')

    grunt.registerTask('build', ['clean', 'transport', 'concat', 'uglify', 'cssmin', 'clean:0'])
    grunt.registerTask('default', 'build')

    grunt.task.run('default')
    grunt.task.start()
}

builder(require('grunt'))