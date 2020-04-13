module.exports = async function runScraper (scraper, parsed, date) {
  let params = {}
  if (parsed.length === 1) params = parsed[0]['default']
  else {
    for (const item of parsed) {
      params[item] = item
    }
  }
  // Only await async functions; most scrapers should not be async
  if (scraper.scrape.constructor.name === 'AsyncFunction') {
    return await scraper.scrape(params, date)
  }
  return scraper.scrape(params, date)
}
