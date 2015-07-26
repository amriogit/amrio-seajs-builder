var UglifyJS = require('uglify-js')

function minify(factory) {
    var ast = UglifyJS.parse(factory)
    ast.figure_out_scope()
    ast = ast.transform(UglifyJS.Compressor({
        warnings: false
    }))
    ast.figure_out_scope()
    ast.compute_char_frequency()
    ast.mangle_names()

    return ast.print_to_string()
}

process.on('message', function(data) {
    var factory = minify(data.factory)
    process.send({
        cid: data.cid,
        factory: factory
    })
})
