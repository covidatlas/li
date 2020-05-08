const arc = require('@architect/functions')
const crawl = require('./_crawl.js')

/**
 * Crawl a source, report the results
 */
async function crawlSource (event) {
  try {
    await crawl(event)

    // Alert status to a successful crawl
    await arc.events.publish({
      name: 'status',
      payload: {
        source: event.source,
        event: 'crawler',
        status: 'success'
      }
    })
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
    throw err
  }
}

exports.handler = arc.events.subscribe(crawlSource)
