var asb = require('../')

var steps = [
    function() {
        asb.transport({
            cwd: 'assets',
            src: '{amrio,biz}/**/*.*',
            dest: '.transport',
            paths: ['assets']
        })
    },
    function() {
        asb.concat({
            cwd: '.transport',
            src: 'amrio/**/*.*',
            dest: '.concat',
            paths: ['.transport']
        })
    },
    function() {
        asb.clean({
            cwd: '.transport',
            src: 'amrio'
        })

        asb.concat({
            cwd: '.transport',
            src: 'biz/**/*.*',
            dest: '.concat',
            paths: ['.transport']
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