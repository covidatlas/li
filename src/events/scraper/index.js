const arc = require('@architect/functions')

const getSource = require('@architect/shared/sources/_lib/get-source.js')
const findTz = require('./find-tz/index.js')
const getDate = require('./get-date/index.js')
const findScraper = require('./find-scraper/index.js')
const loadCache = require('./load-cache/index.js')
const parseCache = require('./parse-cache/index.js')
const runScraper = require('./run-scraper/index.js')
const normalizeData = require('./normalize-data/index.js')
const write = require('./write/index.js')

async function scrapeSource (event) {
  try {
    /**
     * Load the requested source
     */
    const source = getSource(event)
    const { _sourceKey } = source

    /**
     * Get the timezone so we can locale-cast the specified date
     */
    const tz = await findTz(source)

    /**
     * Then normalize the date to the locale of the source
     * (If we don't, then anything running the source across the dateline will have issues)
     */
    const { date, _dateUTC } = getDate(event, tz)
    const timeLabel = `Scrape: ${_sourceKey} / ${date}`
    console.time(timeLabel)

    /**
     * Select the correct scraper for the specified date
     */
    const scraper = findScraper(source, date)

    /**
     * Go acquire the data from the cache
     */
    const cache = await loadCache({ source, scraper, date, _dateUTC, tz })

    /**
     * Parse the requested data to be passed on to the 'scrape' function
     */
    const parsed = await parseCache(cache, date)

    /**
     * Scrape the specified source on the specified date
     */
    const output = await runScraper(scraper, parsed, date)

    /**
     * Normalize output
     */
    const data = normalizeData(source, output, date)

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

    console.timeEnd(timeLabel)
    return data
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
    console.error(`Failed to scrape ${event.source}`)
    throw err
  }
}

exports.handler = arc.events.subscribe(scrapeSource)
