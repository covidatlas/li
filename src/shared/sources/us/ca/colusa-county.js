// Migrated from coronadatascraper, src/shared/scrapers/US/CA/colusa-county.js

const srcShared = '../../../'
const assert = require('assert')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06011',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-17',
      crawl: [
        {
          type: 'page',
          url: 'http://www.countyofcolusa.org/99/Public-Health',
        },
      ],
      scrape ($) {
      const cases = parse.number(
        $('strong:contains("Confirmed Cases:")')
          .first()
          .text()
          .match(/Confirmed Cases: (\d+)/)[1]
      )
      return { cases }
      }
    },
    {
      startDate: '2020-05-03',
      crawl: [
        {
          type: 'page',
          url: 'http://www.countyofcolusa.org/covid19',
        },
      ],
      scrape ($) {
        const el = $('p:contains("Confirmed Cases:")')
        assert.equal(el.length, 1, 'Have 1 <p> containing Confirmed Cases')
        const cases = parse.number(el.eq(0).text())
        return { cases }
      }
    }
  ]
}
