const datetime = require('@architect/shared/datetime/index.js')
const getSource = require('@architect/shared/sources/_lib/get-source.js')
const findTz = require('./find-tz/index.js')
const findScraper = require('@architect/shared/sources/_lib/find-scraper.js')
const loadCache = require('./load-cache/index.js')
const parseCache = require('./parse-cache/index.js')
const runScraper = require('./run-scraper/index.js')
const normalizeData = require('./normalize-data/index.js')

/**
 * Executes the scrape
 */
module.exports = async function scrape (event) {
  try {
    let { date, _useUTCdate } = event

    /**
     * Load the requested source
     */
    const source = getSource(event)
    const { _sourceKey } = source

    /**
     * Get the timezone so we can locale-cast the specified date
     */
    let tz = await findTz(source)
    // Sometimes during certain local workflows we may want to use UTC instead
    if (_useUTCdate) tz = 'UTC'

    /**
     * Then normalize the date to the locale of the source
     * (If we don't, then anything running the source across the dateline will have issues)
     */
    date = date ? datetime.getYYYYMMDD(date) : datetime.cast(null, tz)
    const timeLabel = `Scrape: ${_sourceKey} / ${date}`
    console.time(timeLabel)

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

    console.timeEnd(timeLabel)

    return data
  }
  catch (err) {
    console.error(`Failed to scrape ${event.source}`)
    throw err
  }
}
