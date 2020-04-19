/** List of allowable crawl types. */

// TODO (techdebt): use this in scraper validation.
const allowedTypes = [
  'page',
  'headless',
  'csv',
  'tsv',
  'pdf',
  'json',
  'raw'
]

module.exports = {
  allowedTypes
}
