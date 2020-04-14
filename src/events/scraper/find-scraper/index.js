const datetime = require('@architect/shared/datetime/index.js')
const sorter = require('@architect/shared/utils/sorter.js')

module.exports = function findScraper (source, date) {
  let scraperToUse = null

  // Timeseries sources should always use the freshest scraper
  if (source.timeseries) {
    const sources = source.scrapers.map(s => s.startDate)
    const sorted = sorter(sources)
    const useThisOne = sorted[sorted.length - 1]
    scraperToUse = source.scrapers.find(s => s.startDate === useThisOne)
  }
  else {
    for (const scraper of source.scrapers) {
      if (datetime.dateIsBeforeOrEqualTo(scraper.startDate, date)) {
        scraperToUse = scraper
      }
    }
  }

  if (scraperToUse === null) {
    throw new Error(
      `Could not find scraper for ${source._sourceKey} at ${date}`
    )
  }

  return scraperToUse
}
