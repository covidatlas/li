// Migrated from coronadatascraper, src/shared/scrapers/US/CA/solano-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06095',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          url: 'http://www.solanocounty.com/depts/ph/coronavirus.asp',
        },
      ],
      scrape ($) {
        const $el = $('*:contains("Number of Positive Cases")').first()
        const matches = $el.text().match(/Number of Positive Cases in Solano County: (\d+)/)
        return { cases: parse.number(matches[1]) }
      }
    },
    {
      startDate: '2020-03-23',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'http://www.solanocounty.com/depts/ph/coronavirus.asp',
        },
      ],
      scrape ($) {
        const lines = $('font:contains("Confirmed COVID-19")')
              .html()
              .split('<br>')
        const cases = parse.number(lines[1].split(':')[1])
        const deaths = parse.number(lines[2].split(':')[1])
        return { cases, deaths }
      }
    },
    {
      startDate: '2020-03-24',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'http://www.solanocounty.com/depts/ph/coronavirus.asp',
        }
      ],
      // eslint-disable-next-line
      scrape ($) {
        // throw new Error('Solano County, CA now uses a PDF');
      }
    },
    {
      startDate: '2020-05-21',
      crawl: [
        {
          // The below URL appears to be scrapable.  It is linked to
          // from main page
          // http://www.solanocounty.com/depts/ph/coronavirus.asp, and
          // is the mobile-friendly version.  It may be constant, not
          // sure, and the source json may perhaps be available
          // elsewhere.
          type: 'headless',
          url: 'https://experience.arcgis.com/experience/1d7b01ace51c478aa0f0bcbb670b097e'
        }
      ],
      // eslint-disable-next-line
      scrape ($) {
        // TODO (scrapers) scrape this, or find source data
      }
    }
  ]
}
