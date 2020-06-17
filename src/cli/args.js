const args = require('yargs')
  .option('crawl', {
    alias: 'c',
    description: 'Crawl the specified Source ID',
    type: 'string'
  })
  .option('scrape', {
    alias: 's',
    description: 'Scrape the specified Source ID',
    type: 'string'
  })
  .option('date', {
    alias: 'd',
    description: 'Generate data for (or start the timeseries at) the provided date in YYYY-MM-DD format',
    type: 'string'
  })
  .option('report', {
    description: 'Generate flat file reports',
    type: 'string'
  })
  .option('regenerate', {
    alias: 'r',
    description: 'Regenerate a source from scratch via cache',
    type: 'string'
  })
  .option('regen-timeseries', {
    description: 'Run the timeseries regenerator (internal testing only, you should probably be using --regenerate)',
    type: 'string'
  })
  .option('runner', {
    description: 'Fire the task runner (internal testing only)',
    type: 'string'
  })
  .option('utc', {
    alias: 'u',
    description: 'Internal / testing only / NOT for production use: scrape a UTC date specified in YYYY-MM-DD format',
    type: 'boolean'
  })
  .help()
  .alias('help', 'h')
  .argv

module.exports = args
