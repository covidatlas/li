// Migrated from coronadatascraper, src/shared/scrapers/US/CA/contra-costa-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06013',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'headless',
          url: 'https://www.coronavirus.cchealth.org/',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('h1:contains("TOTAL")')
            .parent()
            .next()
            .text()
        )
        const deaths = parse.number(
          $('h1:contains("DEATHS")')
            .parent()
            .prev()
            .text()
        )
        return {
          cases,
          deaths
        }
      }
    },
    {
      // TODO: around this date, the returned data started being invalid.
      // Deaths went from 3 to 222 overnight, and today (may 20),
      // https://www.coronavirus.cchealth.org/ shows total deaths = 33.
      startDate: '2020-03-31',
      crawl: [
        {
          type: 'headless',
          url: 'https://www.coronavirus.cchealth.org/',
        },
      ],
      // eslint-disable-next-line
      scrape ($) {
        return {
          cases: undefined,
          deaths: undefined
        }
      }
    }
  ]
}
