const arc = require('@architect/functions')
const datetime = require('@architect/shared/datetime/index.js')

const getSource = require('@architect/shared/sources/_lib/get-source.js')
const findTz = require('./find-tz/index.js')
const findScraper = require('./find-scraper/index.js')
const loadCache = require('./load-cache/index.js')
const parseCache = require('./parse-cache/index.js')
const runScraper = require('./run-scraper/index.js')
const normalizeData = require('./normalize-data/index.js')

async function scrapeSource (event) {
  try {
    console.time('Scrape')
    let { date } = event
    // Normalize date
    date = date ? datetime.getYYYYMMDD(date) :  datetime.getYYYYMMDD(new Date().toLocaleDateString())

    /**
     * Load the requested source
     */
    const source = getSource(event)

    /**
     * Get the timezone so we can locale-cast the specified date
     */
    const tz = await findTz(source)

    /**
     * Select the correct scraper for the specified date
     */
    const scraper = findScraper(source, date)

    /**
     * Go acquire the data from the cache
     */
    const cache = await loadCache({ source, scraper, date, tz })

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
    // TODO ↓ remove me! ↓
    console.log(`data:`, data)

    // TODO coming soon:
    // await write(data)

    console.timeEnd('Scrape')
  }
  catch (err) {
    // TODO write something to the database that says this source is offline
    console.log('Scraper error', event)
    throw Error(err)
  }
}

exports.handler = arc.events.subscribe(scrapeSource)
