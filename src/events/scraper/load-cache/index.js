const loadLocal = require('./_load-local.js')
const loadS3 = require('./_load-s3.js')

/**
 * Loads one or more files from cache
 */
module.exports = async function loadFromCache (scraper, _locationKey) {

  const local = process.env.NODE_ENV === 'testing' || process.env.ARC_LOCAL
  const load = local ? loadLocal : loadS3

  return load(scraper, _locationKey)
}
