var gct = require('grunt-cmd-transport')

module.exports = function(grunt) {
    var style = gct.style.init(grunt),
        text = gct.text.init(grunt),
        script = gct.script.init(grunt),
        template = gct.template.init(grunt)

    return function(options) {
        var transportOptions = {
            options: {
                parsers: {
                    '.js': [script.jsParser],
                    '.css': [style.cssParser, style.css2jsParser],
                    '.html': [text.html2jsParser],
                    '.tpl': [template.tplParser],
                    '.handlebars': [template.handlebarsParser]
                },
                paths: options.paths,
                alias: options.alias,
                debug: options.debug || false
            },
            files: [{
                expand: true,
                cwd: options.cwd || './',
                src: options.src,
                dest: options.dest
            }]
        }

        grunt.initConfig({
            transport: {
                transport: transportOptions
            }
        })

        grunt.task.run('transport')
        grunt.task.start()
    }
}
