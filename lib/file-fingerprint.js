var crypto = require('crypto')

function MD5(file) {
    var encoding = typeof file === 'string' ? 'utf-8' : 'binary'
    var hash = crypto.createHash('md5')
    hash.update(file, encoding)
    return hash.digest('hex')
}

module.exports = MD5