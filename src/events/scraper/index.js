const arc = require('@architect/functions')
const scrape = require('./_scrape.js')
const write = require('./write/index.js')

/**
 * Scrape a source, report the results
 */
async function scrapeSource (event) {
  try {
    const data = await scrape(event)

    /**
     * Write to the database
     */
    const locationIDs = await write(data)

    // Fire locations update
    await arc.events.publish({
      name: 'locations',
      payload: { locationIDs }
    })

    // Alert status to a successful crawl
    await arc.events.publish({
      name: 'status',
      payload: {
        source: event.source,
        event: 'scraper',
        status: 'success'
      }
    })

    return { data, locationIDs }
  }
  catch (err) {
    // Cache loading date bounds errors are valid, but do not need to update status
    if (!err.message.startsWith('DATE_BOUNDS_ERROR')) {
      // Alert status to a crawl failure
      arc.events.publish({
        name: 'status',
        payload: {
          source: event.source,
          event: 'scraper',
          status: 'failed'
        }
      })
    }
    throw err
  }
}

exports.handler = arc.events.subscribe(scrapeSource)
