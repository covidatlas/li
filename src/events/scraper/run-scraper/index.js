const assertTotalsAreReasonable = require('./scraper-helpers/assert-totals-are-reasonable')
const getIso2FromName = require('./scraper-helpers/get-iso2-from-name')
const getSchemaKeyFromHeading = require('./scraper-helpers/get-schema-key-from-heading')
const getDataWithTestedNegativeApplied = require('./scraper-helpers/get-data-with-tested-negative-applied')
const groupBy = require('./scraper-helpers/group-by')
const normalizeTable = require('./scraper-helpers/normalize-table')
const transposeArrayOfArrays = require('./scraper-helpers/transpose-array-of-arrays')

const scraperHelpers = {
  assertTotalsAreReasonable,
  getIso2FromName,
  getSchemaKeyFromHeading,
  getDataWithTestedNegativeApplied,
  groupBy,
  normalizeTable,
  transposeArrayOfArrays,
}

module.exports = async function runScraper (scraper, parsed, date) {
  let params = {}
  // A single crawl passes back a single object
  if (parsed.length === 1) params = parsed[0]['default']
  // Multiple crawls pass back an object with a named param for each `crawl.name`
  else {
    for (const item of parsed) {
      Object.assign(params, item)
    }
  }
  let results
  // Only await async functions; most scrapers should not be async
  if (scraper.scrape.constructor.name === 'AsyncFunction') {
    results = await scraper.scrape(params, date, scraperHelpers)
  }
  else {
    results = scraper.scrape(params, date, scraperHelpers)
  }

  // Ensure single results are iterable
  results = results instanceof Array ? results : [ results ]

  return results
}
