const getSource = require('../../src/shared/sources/_lib/get-source.js')

/**
 * Enable:
 * --[source|crawl|scrape] 'nl' instead of 'nl/index.js'
 * --[source|crawl|scrape] 'us/ca/san-francisco-county' instead of 'us/ca/san-francisco-county.js'
 */
module.exports = function makeNice (params) {
  let { crawl, scrape, regenerate, regenTimeseries, report, runner } = params

  // Yargs passes empty strings with truthy cli arguments so ok
  const yargy = arg => arg || arg === ''

  if (yargy(crawl) || yargy(scrape) || yargy(regenerate)) {
    const checkSource = p => {
      getSource(p)
      return p
    }
    if (yargy(crawl)) crawl = checkSource(crawl)
    if (yargy(scrape)) scrape = checkSource(scrape)
    if (yargy(regenerate)) regenerate = checkSource(regenerate)
  }
  if (regenTimeseries === '') {
    regenTimeseries = true
  }
  if (report === '') {
    report = true
  }
  if (runner === '') {
    runner = true
  }
  return { crawl, scrape, regenerate, regenTimeseries, report, runner }
}
