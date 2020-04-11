const arc = require('@architect/functions')
const loadLocation = require('./_load-location/index.js')
const crawl = require('./_crawl')
// const cache = require('./cacher')

async function crawlLocation (event) {

  /**
   * Load the requested location
   */
  const location = loadLocation(event)

  /**
   * Select the current scraper from the location's available scrapers
   */
  // TODO actually calculate latest start date; this hack works for now
  const scraper = location.scrapers[location.scrapers.length - 1]

  /**
   * Prepare all the 'get' results to be cached
   */
  const results = []
  for (let source of scraper.get) {
    let { url } = source
    source.url = typeof url === 'string'
                   ? url
                   : await url(/*client*/)
    const result = await crawl(source)
    results.push(result)
  }

  if (results.length !== scraper.get.length) {
    throw Error(`Failed to crawl all requested 'get' sources`)
  }

  /**
   * Cache the results
   */
  // await cacher(results)
}

exports.handler = arc.events.subscribe(crawlLocation)
