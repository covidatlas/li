const arc = require('@architect/functions')
const loadLocation = require('./load-location/index.js')
const loadCache = require('./load-cache/index.js')
const parseCache = require('./parse-cache/index.js')
const runScraper = require('./run-scraper/index.js')

async function scrapeLocation (event) {
  try {
    const { date } = event

    /**
     * Load the requested location
     */
    const location = loadLocation(event)
    const { scrapers, _locationKey } = location

    // FIXME add date casting for locale
    // This is NOT the right way to select our scraper
    const scraper = scrapers[scrapers.length - 1]

    const cache = await loadCache(scraper, _locationKey, date)

    const parsed = await parseCache(cache, date)

    const scrape = await runScraper(scraper, parsed)
    // TODO ↓ remove me! ↓
    console.log(`scrape:`, scrape)

    // TODO add location normalization!
  }
  catch (err) {
    console.error(err)
    throw Error(err)
  }
}

exports.handler = arc.events.subscribe(scrapeLocation)
module.exports = scrapeLocation
