const arc = require('@architect/functions')
const loadLocation = require('./load-location/index.js')
const crawler = require('./crawl')
const cache = require('./cache')

async function crawlLocation (event) {

  /**
   * Load the requested location
   */
  const location = loadLocation(event)
  const { scrapers, _locationKey } = location

  /**
   * Select the current scraper from the location's available scrapers
   */
  // TODO actually calculate latest start date; this hack works for now
  const scraper = scrapers[scrapers.length - 1]

  /**
   * Prepare all the 'get' results to be cached
   */
  const results = []
  // TODO maybe want to make this Promise.all once things are stable
  for (let crawl of scraper.crawl) {
    let { type, url } = crawl
    crawl.url = typeof url === 'string'
                   ? url
                   : await url(/*client*/)
    const data = await crawler(crawl)
    const result = {
      // Caching metadata
      _locationKey,
      _name: scraper.crawl.length > 1 ? crawl.name : 'default',
      // Payload
      data,
      type
    }

    results.push(result)
  }

  if (results.length !== scraper.crawl.length) {
    throw Error(`Failed to crawl all requested 'get' sources`)
  }

  /**
   * Cache the results
   */
  await cache(results)
}

exports.handler = arc.events.subscribe(crawlLocation)
module.exports = crawlLocation
