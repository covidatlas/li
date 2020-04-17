const sourceMap = require('../../src/shared/sources/_lib/source-map.js')

/**
 * Enable:
 * --[source|crawl|scrape] 'nl' instead of 'nl/index.js'
 * --[source|crawl|scrape] 'us/ca/san-francisco-county' instead of 'us/ca/san-francisco-county.js'
 */
module.exports = function makeNice (params) {
  let { crawl, scrape, regenerate, regenTimeseries } = params

  // Yargs passes empty strings with truthy cli arguments so ok
  const yargy = arg => arg || arg === ''

  if (yargy(crawl) || yargy(scrape) || yargy(regenerate)) {
    const sources = sourceMap()
    const getSource = p => {
      const exact = sources[p]
      if (exact) return p
      else throw Error('Source not found!')
    }
    if (yargy(crawl)) crawl = getSource(crawl)
    if (yargy(scrape)) scrape = getSource(scrape)
    if (yargy(regenerate)) regenerate = getSource(regenerate)
  }
  if (regenTimeseries === '') {
    regenTimeseries = true
  }
  return { crawl, scrape, regenerate, regenTimeseries }
}
