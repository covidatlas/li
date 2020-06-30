const writeLocal = require('./_write-local.js')
const writeS3 = require('./_write-s3.js')

/** Get the correct s3 implementation. */
function getWriter () {
  const local = process.env.NODE_ENV === 'testing'
  return local ? writeLocal : writeS3
}

async function writeFile (filename, content) {
  const writer = getWriter()
  await writer.writeFile(filename, content)
}

function getWritableStream (filename) {
  const writer = getWriter()
  return writer.getWritableStream(filename)
}

module.exports = {
  writeFile,
  getWritableStream
}
