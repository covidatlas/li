const writeLocal = require('./_write-local.js')
const writeS3 = require('./_write-s3.js')

/** Get the correct implementation. */
function getWriter () {
  const local = process.env.NODE_ENV === 'testing'
  return local ? writeLocal : writeS3
}

module.exports = {
  getWriter
}
