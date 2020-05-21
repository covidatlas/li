// Migrated from coronadatascraper, src/shared/scrapers/US/CA/san-luis-obispo-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06079',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.chunder ],
  scrapers: [
    {
      startDate: '2020-03-20',
      crawl: [
        {
          type: 'page',
          url: 'this.url',
        },
      ],
      scrape ($) {
        // TODO (scrapers) Validate structure (and on all other us/ca county scrapers)
        let cases = $('td:contains("San Luis Obispo County")')
            .next()
            .text()
        cases = parse.number(cases)
        return { cases }
      }
    }
  ]
}
