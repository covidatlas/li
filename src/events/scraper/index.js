const arc = require('@architect/functions')
const loadSource = require('./load-source/index.js')
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
    const { scrapers, _sourceKey } = source

    // FIXME add date casting for locale
    // This is NOT the right way to select our scraper
    const scraper = scrapers[scrapers.length - 1]

    const cache = await loadCache(scraper, _sourceKey, date)

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

exports.handler = arc.events.subscribe(scrapeSource)
module.exports = scrapeSource
