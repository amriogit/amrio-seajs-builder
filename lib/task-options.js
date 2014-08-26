var path = require('path'),
    _ = require('underscore'),
    style = require('grunt-cmd-transport').style

module.exports = function(grunt, inPath, outPath, include) {

    var defaults = {
        base: './',
        tmpDir: './tmp',
        paths: ['sea-modules'],
        alias: {},
        except: ['$', 'jQuery'],
        min: true,
        banner: '/* build by amrio-seajs-builder <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n'
    }

    _.extend(defaults, {
        tmpDirTransport: path.join(defaults.tmpDir, '.transport'),
        tmpDirConcat: path.join(defaults.tmpDir, '.concat'),
        inPath: inPath,
        outPath: outPath,
        include: include
    })

    function getTransportOptions() {
        return {
            options: {
                debug: false
            },
            transport: {
                alias: defaults.alias,
                paths: defaults.paths,
                files: [{
                    expand: true,
                    src: path.join(defaults.inPath, '**/*.{js,css,json,tpl,html,htm}'),
                    dest: defaults.tmpDirTransport
                }]
            },
            transportCss2js: {
                options: {
                    parsers: {
                        '.css': [style.init(grunt).css2jsParser]
                    }
                },
                files: [{
                    expand: true,
                    cwd: defaults.tmpDirTransport,
                    src: '**/*.css',
                    dest: defaults.tmpDirTransport
                }]
            }
        }
    }

    function getConcatOptions() {
        var commonOptions = {
            options: {
                paths: _.extend([defaults.tmpDirTransport], defaults.paths),
                include: defaults.include
            },
            files: [{
                cwd: defaults.tmpDirTransport,
                expand: true,
                filter: 'isFile',
                src: ['**/*.{js,css}', '!**/*{-debug,css}.*'],
                dest: defaults.tmpDirConcat
            }]
        }
        return {
            options: {
                css2js: style.css2js
            },
            concat: commonOptions,
            concat2: _.extend({}, commonOptions, {
                options: {
                    paths: _.extend([defaults.tmpDirConcat], commonOptions.options.paths)
                },
                dest: defaults.outPath
            })
        }
    }

    function getUglifyOptions() {
        return {
            options: {
                mangle: {
                    except: defaults.except
                },
                banner: defaults.banner
            },
            uglify: {
                files: [{
                    expand: true,
                    cwd: defaults.outPath,
                    src: [path.join(defaults.outPath, '**/*.js'), '!**/*-debug.*'],
                    dest: defaults.outPath
                }]
            }
        }
    }

    function getCssMinOptions() {
        return {
            cssmin: {
                expand: true,
                cwd: defaults.outPath,
                src: [path.join(defaults.outPath, '**/*.css'), '!**/*-debug.*'],
                dest: defaults.outPath
            }
        }
    }

    function getClearOptions() {
        return [defaults.tmpDir]
    }

    function getCopyOptions() {
        return {
            copy: {
                files: [{
                    expand: true,
                    src: path.join(defaults.inPath, '**'),
                    dest: defaults.outPath
                }]
            }
        }
    }

    return {
        defaults: defaults,
        getTransportOptions: getTransportOptions,
        getConcatOptions: getConcatOptions,
        getUglifyOptions: getUglifyOptions,
        getCssMinOptions: getCssMinOptions,
        getClearOptions: getClearOptions,
        getCopyOptions: getCopyOptions
    }
}
