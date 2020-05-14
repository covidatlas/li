const csvParse = require('csv-parse/lib/sync')

/**
 * Parse CSV
 * @param {*} data the CSV payload to parse
 * @param {*} options customizable options:
 *  - delimiter: the delimiter to use (default is ,)
 */
module.exports = function csv (params) {
  const { content, options={} } = params
  return csvParse(content, {
    delimiter: options.delimiter,
    columns: true
  })
}
