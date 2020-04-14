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
    results = await scraper.scrape(params, date)
  }
  results = scraper.scrape(params, date)

  // Ensure single results are iterable
  results = results instanceof Array ? results : [results]

  return results
}
