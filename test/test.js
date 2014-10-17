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
            minify: false
        })
        asb.build({
            src: 'biz',
            minify: false,
            include: 'all'
        })
    }
]

function doStep(step) {
    step--
    steps[step] && steps[step]()
}

doStep(1)
doStep(2)
doStep(3)
doStep(4)