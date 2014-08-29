var path = require('path'),
    _ = require('underscore'),
    style = require('grunt-cmd-transport').style

module.exports = function(grunt, inPath, outPath, include, paths) {

    var defaults = {
        base: './',
        tmpDir: './.tmp',
        paths: ['sea-modules'],
        alias: {},
        except: ['$', 'jQuery'],
        min: true,
        banner: '/* amrio-seajs-builder <%= grunt.template.today("yyyy-mm-dd HH:MM:ss") %> */\n'
    }

    _.extend(defaults, {
        tmpDirTransport: path.join(defaults.tmpDir, '.transport'),
        tmpDirConcat: path.join(defaults.tmpDir, '.concat'),
        tmpDirOut: path.join(defaults.tmpDir, '.out'),
        inPath: inPath,
        outPath: outPath,
        include: include
    })

    function getTransportOptions() {
        return {
            transport: {
                alias: defaults.alias,
                // paths: [defaults.base, defaults.paths],
                files: [{
                    expand: true,
                    cwd: defaults.base,
                    src: path.join(defaults.inPath, '**/*.{js,css,tpl}'),
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
        return {
            options: {
                css2js: style.css2js
            },
            concat: {
                options: {
                    paths: [defaults.tmpDirTransport].concat(defaults.paths),
                    include: defaults.include
                },
                files: [{
                    expand: true,
                    cwd: defaults.tmpDirTransport,
                    src: ['**/*.{js,css}', '!**/*-debug.*', '!**/*.{css,tpl}.js'],
                    dest: defaults.tmpDirConcat
                }]
            }
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
                    cwd: defaults.tmpDirConcat,
                    src: ['**/*.js'],
                    dest: defaults.outPath
                }]
            }
        }
    }

    function getCssMinOptions() {
        return {
            cssmin: {
                expand: true,
                cwd: defaults.tmpDirConcat,
                src: ['**/*.css'],
                dest: defaults.outPath
            }
        }
    }

    function getCleanOptions() {
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
        getCleanOptions: getCleanOptions,
        getCopyOptions: getCopyOptions
    }
}
