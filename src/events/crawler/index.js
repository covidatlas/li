const arc = require('@architect/functions')
const getSource = require('@architect/shared/sources/_lib/get-source.js')
const crawler = require('./crawl')
const cache = require('./cache')

async function crawlSource (event) {
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
      let { type, url } = crawl
      crawl.url = typeof url === 'string'
                     ? url
                     : await url(crawler.client)

      // A crawl may pass back a URL or { url, cookie }; extract and pass along
      if (crawl.url.cookies) {
        crawl.cookies = crawl.url.cookies
      }
      if (crawl.url.url) {
        crawl.url = crawl.url.url
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

    // Alert status to a successful crawl
    await arc.events.publish({
      name: 'status',
      payload: {
        source: event.source,
        event: 'crawler',
        status: 'success'
      }
    })

    console.timeEnd(timeLabel)
  }
  catch (err) {
    // Alert status to a crawl failure
    arc.events.publish({
      name: 'status',
      payload: {
        source: event.source,
        event: 'crawler',
        status: 'failed'
      }
    })

    console.log('Crawler error', event)
    throw Error(err)
  }
}

exports.handler = arc.events.subscribe(crawlSource)
