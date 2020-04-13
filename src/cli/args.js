const args = require('yargs')
  .option('source', {
    description: 'Crawl & scrape the source path name (src/shared/sources)',
    type: 'string'
  })
  .option('crawl', {
    alias: 'c',
    description: 'Crawl the source path name (src/shared/sources)',
    type: 'string'
  })
  .option('scrape', {
    alias: 's',
    description: 'Scrape the source path name (src/shared/sources)',
    type: 'string'
  })
  .option('date', {
    alias: 'd',
    description: 'Generate data for (or start the timeseries at) the provided date in YYYY-MM-DD format',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .argv

module.exports = args
