var asb = require('../')

var steps = [

    function() {
        asb.clean({
            cwd: './',
            src: ['transport', 'concat']
        })

        asb.transport({
            cwd: 'assets',
            src: '{amrio,biz}/**/*.*',
            dest: 'transport',
            paths: ['assets']
        })
    },
    function() {
        asb.concat({
            cwd: 'transport',
            src: 'amrio/**/*.*',
            dest: 'concat',
            paths: ['transport', 'concat']
        })
    },
    function() {

        asb.clean({
            cwd: './',
            src: ['transport/amrio']
        })

        asb.concat({
            cwd: 'transport',
            src: 'biz/**/*.*',
            dest: 'concat',
            paths: ['transport', 'concat'],
            include: 'all'
        })
    },
    function() {
        process.chdir('./assets')
        asb.build({
            src: 'amrio',
            minify: false,
            clean: false,
            debug: true
        })
        asb.build({
            src: 'biz',
            minify: false,
            include: 'all',
            clean: false,
            debug: true
        })
    },
    function() {
        process.chdir('./assets')

        asb.build({
            src: 'amrio',
            minify: false,
            clean: false,
            debug: true
        })
        asb.build({
            src: 'biz',
            minify: false,
            include: 'all',
            clean: false,
            debug: true
        })
    },
    function() {
        process.chdir('./assets')

        asb.build({
            src: 'amrio/tips/style.css',
            minify: false,
            clean: false,
            debug: true
        })
        // 
        // extraCSSDeps()
    }
]

function doStep(step) {
    step--
    steps[step] && steps[step]()
}

function extraCSSDeps() {
    var css = require('cmd-util').css
    var data = css.parse(asb.grunt.file.read('amrio/tips/style.css'))

    var deps = data[0].code.filter(function(d) {
        return d.type === 'import'
    }).map(function(d) {
        return d.id
    })

    console.log(deps)
}

// doStep(1)
// doStep(2)
// doStep(3)
// doStep(4)
doStep(5)
// doStep(6)
