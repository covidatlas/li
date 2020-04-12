const parse = require('./_parse.js')
const { getYYYYMMDD } = require('./_format.js')

/** @returns {string} The value of the SCRAPE_DATE environment variable, as an ISO date */
function scrapeDate () {
  return process.env.SCRAPE_DATE ? parse(process.env.SCRAPE_DATE) : undefined
}

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is earlier than the scrape date.
 */
function scrapeDateIsBefore (d) {
  const date = scrapeDate() ? scrapeDate() : getYYYYMMDD()
  return date < parse(d)
}

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is later than the scrape date.
 */
function scrapeDateIsAfter (d) {
  const date = scrapeDate() ? scrapeDate() : getYYYYMMDD()
  return date > parse(d)
}

/**
 * @param {string|Date} d The date to compare to the scrape date.
 * @returns {boolean} true if the date is equal to the scrape date.
 */
function scrapeDateIs (d) {
  const date = scrapeDate() ? scrapeDate() : getYYYYMMDD()
  return date === parse(d)
}

module.exports = {
  scrapeDate,
  scrapeDateIsBefore,
  scrapeDateIsAfter,
  scrapeDateIs,
}
