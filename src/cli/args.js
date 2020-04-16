const args = require('yargs')
  .option('crawl', {
    alias: 'c',
    description: 'Crawl the source (keyed on path name)',
    type: 'string'
  })
  .option('scrape', {
    alias: 's',
    description: 'Scrape the source (keyed on path name)',
    type: 'string'
  })
  .option('date', {
    alias: 'd',
    description: 'Generate data for (or start the timeseries at) the provided date in YYYY-MM-DD format',
    type: 'string'
  })
  .option('regenerate', {
    alias: 'r',
    description: 'Regenerate a source from scratch via cache',
    type: 'string'
  })
  .option('regen-timeseries', {
    description: 'Run the timeseries regenerator (testing only, you should probably be using --regenerate)',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .argv

module.exports = args
