const getSource = require('@architect/shared/sources/_lib/get-source.js')
const crawler = require('./crawler')
const cache = require('./cache')

/**
 * Executes the crawl
 */
module.exports = async function crawl (event) {
  try {
    /**
     * Load the requested source
     */
    const source = getSource(event)
    const { scrapers, _sourceKey } = source

    const timeLabel = `Crawl ${_sourceKey}`
    console.time(timeLabel)

    /**
     * Select the current scraper from the source's available scrapers.
     * Scrapers are guaranteed to be in startDate order.
     */
    const scraper = scrapers[scrapers.length - 1]

    /**
     * Prepare all the 'get' results to be cached
     */
    const results = []
    // TODO maybe want to make this Promise.all once things are stable
    for (let crawl of scraper.crawl) {
      let { type, url } = crawl
      if (typeof url !== 'string') {
        const result = await url(crawler.client)
        Object.assign(crawl, result)
      }

      const response = await crawler(type, crawl)
      const data = response.body
      const result = {
        // Caching metadata
        _sourceKey,
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

    console.timeEnd(timeLabel)
  }
  catch (err) {
    console.log('Crawler error', event)
    throw err
  }
}
