/**
 * Allowable crawl types (and corresponding extensions)
 */

 const allowed = [
  'page',
  'headless',
  'csv',
  'tsv',
  'pdf',
  'json',
  'raw'
]

const extensions = {
  csv: 'csv',
  headless: 'html',
  json: 'json',
  page: 'html',
  pdf: 'pdf',
  tsv: 'tsv',
  raw: 'raw'
}

module.exports = {
  allowed,
  extensions
}
