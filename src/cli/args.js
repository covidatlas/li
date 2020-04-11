const args = require('yargs')
  .option('location', {
    alias: 'l',
    description: 'Scrape only the location provided by src/shared/locations path name',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .argv

module.exports = args
