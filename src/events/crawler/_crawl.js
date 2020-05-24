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
     * Select the current scraper from the source's available scrapers
     */
    // TODO actually calculate latest start date; this hack works for now
    const scraper = scrapers[scrapers.length - 1]

    /**
     * Prepare all the 'get' results to be cached
     */
    const results = []
    // TODO maybe want to make this Promise.all once things are stable
    for (let crawl of scraper.crawl) {
      let { type, url, paginated } = crawl

      const _name = scraper.crawl.length > 1 ? crawl.name : 'default'
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
        async function paginatedClient (url, options = {}) {
          const crawlOpts = { ...crawl, url, ...options }
          return crawler(type, crawlOpts)
        }
        const bodies = await paginated(paginatedClient)
        bodies.forEach(body => {
          const result = { ...baseResult, data: body }
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
