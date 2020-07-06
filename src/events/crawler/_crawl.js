const getSource = require('@architect/shared/sources/_lib/get-source.js')
const assert = require('assert')
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
      let { type, url, paginated } = crawl

      const _name = crawl.name || 'default'
      const baseResult = {
        // Caching metadata
        _sourceKey,
        _name,
        // Payload
        type
      }

      if (url) {
        if (typeof url !== 'string') {
          const result = await url(crawler.client)
          Object.assign(crawl, result)
        }
        const response = await crawler(type, crawl)
        const result = { ...baseResult, data: response.body }
        results.push(result)
      }
      if (paginated) {
        const pc = crawler.makePaginatedClient(type, crawl)
        const bodies = await paginated(pc)
        assert(Array.isArray(bodies), `pagination must return an array, but got ${typeof(bodies)}`)
        bodies.forEach((body, page) => {
          const result = { ...baseResult, data: body, page }
          results.push(result)
        })
      }
    }
    // console.log(JSON.stringify(results, null, 2))

    const names = results.map(r => r._name)
    const uniqueNames = Array.from(new Set(names))
    if (uniqueNames.length !== scraper.crawl.length) {
      throw Error(`Failed to crawl all requested 'get' sources, only got ${uniqueNames.join()}`)
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
