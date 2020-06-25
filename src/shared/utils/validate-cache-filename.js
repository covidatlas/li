const { extensions } = require('../sources/_lib/crawl-types.js')
const { parse } = require('./parse-cache-filename.js')

module.exports = function validateCacheFilename (filename) {
  // If the name can't be parsed, it's not valid.
  const p = parse(filename)

  // Check extensions
  const exts = Object.values(extensions)
  if (!exts.some(a => a === p.extension)) {
    throw new Error(`Bad cache extension: ${filename}`)
  }
}
