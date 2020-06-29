const writeLocal = require('./_write-local.js')
const writeS3 = require('./_write-s3.js')

/** Get the correct s3 implementation. */
function getWrite () {
  const local = process.env.NODE_ENV === 'testing'
  return local ? writeLocal : writeS3
}

async function writeFile (filename, content) {
  const write = getWrite()
  await write(filename, content)
}

module.exports = writeFile
