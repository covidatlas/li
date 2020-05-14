const csv = require('./csv.js')

/**
 * Parse a TSV payload
 * @param {*} data the TSV payload to parse
 */
module.exports = function tsv (params) {
  const { content } = params
  const options = { delimiter: '\t' }
  return csv({ content, options })
}
