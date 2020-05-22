// Migrated from coronadatascraper, src/shared/scrapers/US/CA/shasta-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06089',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-14',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'https://www.co.shasta.ca.us/index/hhsa/health-safety/current-heath-concerns/coronavirus',
        },
      ],
      scrape ($) {
        const $el = $('h3:contains("Positive cases:")').first()
        const matches = $el.text().match(/Positive cases:.*?(\d+)/)
        return { cases: parse.number(matches[1]) }
      }
    },
    {
      startDate: '2020-03-20',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.co.shasta.ca.us/covid-19/overview',
        },
      ],
      scrape ($) {
        const $el = $('td:contains("Total Confirmed Cases")').next('td')
        return { cases: parse.number($el.text()) }
      }
    }
  ]
}
