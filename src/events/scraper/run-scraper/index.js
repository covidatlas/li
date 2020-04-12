module.exports = async function runScraper (scraper, parsed) {
  let params = {}
  if (parsed.length === 1) params = parsed[0]['default']
  else {
    for (const item of parsed) {
      params[item] = item
    }
  }
  return await scraper.scrape(params)
}
