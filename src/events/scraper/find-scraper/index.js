const datetime = require('@architect/shared/datetime/index.js')

module.exports = function findScraper (source, date) {
  let scraperToUse = null
  for (const scraper of source.scrapers) {
    if (datetime.dateIsBeforeOrEqualTo(scraper.startDate, date)) {
      scraperToUse = scraper
    }
  }
  if (scraperToUse === null) {
    throw new Error(
      `Could not find scraper for ${source._sourceKey} at ${date}`
    )
  }
  return scraperToUse
}
