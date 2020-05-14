const cheerio = require('cheerio')

/**
 * Parse a web page and return a Cheerio object
 * @param {*} data the CSV payload to parse
 */
module.exports = function page (params) {
  const { content } = params
  return cheerio.load(content)
}
