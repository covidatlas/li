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
        // Concatenation of all results.
        let data = []

        // First page of results.
        const firstCrawl = { type, url: paginated.first }
        const firstResp = await crawler(type, firstCrawl)
        const firstJson = JSON.parse(firstResp.body.toString())
        data = data.concat(paginated.records(firstJson))

        // Subsequent pages, if any.
        let nextHsh = Object.assign(firstResp, { json: firstJson })
        let next = paginated.next(nextHsh)
        let n = 2
        while (next) {
          console.log(`... page ${n}`)
          const nextCrawl = { type, url: next.url }
          const nextResp = await crawler(type, nextCrawl)
          const nextJson = JSON.parse(nextResp.body.toString())
          data = data.concat(paginated.records(nextJson))
          let nextHsh = Object.assign(nextResp, { json: nextJson })
          next = paginated.next(nextHsh)
          ++n
        }

        const result = { ...baseResult, data: JSON.stringify(data) }
        results.push(result)
      }
    }


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
