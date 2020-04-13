const arc = require('@architect/functions')
const loadSource = require('./load-source/index.js')
const findTz = require('./find-tz/index.js')
const findScraper = require('./find-scraper/index.js')
const loadCache = require('./load-cache/index.js')
const parseCache = require('./parse-cache/index.js')
const runScraper = require('./run-scraper/index.js')

async function scrapeSource (event) {
  try {
    const { date } = event

    /**
     * Load the requested source
     */
    const source = loadSource(event)
    const { _sourceKey } = source

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
    const cache = await loadCache({ scraper, _sourceKey, date, tz })

    /**
     * Parse the requested data to be passed on to the 'scrape' function
     */
    const parsed = await parseCache(cache, date)

    /**
     * Scrape the specified source on the specified date
     */
    const scrape = await runScraper(scraper, parsed, date)
    // TODO ↓ remove me! ↓
    console.log(`scrape:`, scrape)

    // TODO add location normalization!
  }
  catch (err) {
    console.error(err)
    throw Error(err)
  }
}

exports.handler = arc.events.subscribe(scrapeSource)
module.exports = scrapeSource
