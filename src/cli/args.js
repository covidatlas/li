const args = require('yargs')
  .option('location', {
    alias: 'l',
    description: 'Crawl & scrape the location path name (src/shared/locations)',
    type: 'string'
  })
  .option('crawl', {
    alias: 'c',
    description: 'Crawl the location path name (src/shared/locations)',
    type: 'string'
  })
  .option('scrape', {
    alias: 's',
    description: 'Scrape the location path name (src/shared/locations)',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .argv

module.exports = args
