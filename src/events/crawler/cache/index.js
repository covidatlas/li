const { join } = require('path')
const hash = require('@architect/shared/cache/_hash.js')
const convert = require('@architect/shared/cache/_convert-timestamp.js')
const writeLocal = require('./_write-local.js')
const writeS3 = require('./_write-s3.js')
const { extensions } = require('@architect/shared/sources/_lib/crawl-types.js')

/**
 * Saves one or more files to cache
 *
 * @param {*} results Array of crawl results
 */
module.exports = async function saveToCache (results) {

  const local = process.env.NODE_ENV === 'testing'
  const write = local ? writeLocal : writeS3

  for (const result of results) {
    const { _sourceKey, _name, data, type } = result
    const now = new Date().toISOString()
    const contents = hash(data, 5)
    const ext = extensions[type]
    const date = now.substr(0, 10)
    const time = convert.Z8601ToFilename(now)
    const filePath = join(_sourceKey, date)
    const filename = `${time}-${_name}-${contents}.${ext}`
    await write(data, filePath, filename)
  }
}
