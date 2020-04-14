module.exports = async function runScraper (scraper, parsed, date) {
  let params = {}
  if (parsed.length === 1) params = parsed[0]['default']
  else {
    for (const item of parsed) {
      params[item] = item
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
