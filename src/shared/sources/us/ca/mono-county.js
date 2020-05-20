// Migrated from coronadatascraper, src/shared/scrapers/US/CA/mono-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06051',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina, maintainers.jzohrab ],
  scrapers: [
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'headless',
          url: 'https://monocovid19-monomammoth.hub.arcgis.com/',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('h4:contains("POSITIVE")')
            .first()
            .parent()
            .next('h3')
            .text()
        )
        return { cases }
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'headless',
          url: 'https://monocovid19-monomammoth.hub.arcgis.com/',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('h4:contains("POSITIVECASES")')
            .first()
            .parent()
            .find('h3')
            .first()
            .text()
        )
        const tested = parse.number(
          $('h4:contains("TESTSGIVEN")')
            .first()
            .parent()
            .find('h3')
            .first()
            .text()
        )
        return {
          cases,
          tested
        }
      }
    }
  ]
}
// TODO (scraper) broken, returning only nulls since 2020-03-22
