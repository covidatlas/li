const cacheNamer = require('./_cache-namer.js')
const writeLocal = require('./_write-local.js')
const writeS3 = require('./_write-s3.js')

/**
 * Saves one or more files to cache
 *
 * @param {*} results Array of crawl results
 */
module.exports = async function saveToCache (results) {
  const local = process.env.NODE_ENV === 'testing'
  const write = local ? writeLocal : writeS3

  for (const result of results) {
    const { data } = result
    const { filepath, filename } = cacheNamer(result)
    await write(data, filepath, filename)
  }
}
