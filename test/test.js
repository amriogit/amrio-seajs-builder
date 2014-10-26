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
        asb.clean({
            cwd: './',
            src: ['.tmp/.transport/amrio']
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
            src: 'amrio/tips/index.js',
            minify: false,
            clean: false,
            debug: true,
            test: true
        })
    }
]

function doStep(step) {
    step--
    steps[step] && steps[step]()
}

// doStep(1)
// doStep(2)
// doStep(3)
// doStep(4)
// doStep(5)
doStep(6)
