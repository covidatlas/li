const crypto = require('crypto')

/**
 * Hash a given thing
 */
module.exports = function hash (thing, len=64) {
  return (
    crypto
      .createHash('sha256')
      .update(thing)
      .digest('hex')
      .substr(0, len)
  )
}
