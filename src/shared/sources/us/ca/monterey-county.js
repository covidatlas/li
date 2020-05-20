// Migrated from coronadatascraper, src/shared/scrapers/US/CA/monterey-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06053',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.chunder ],
  scrapers: [
    {
      startDate: '2020-03-20',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.co.monterey.ca.us/government/departments-a-h/administrative-office/office-of-emergency-services/response/covid-19',
        },
      ],
      scrape ($) {
        let cases = 0
        cases += parse.number(
          $('td:contains("Total")').next().text()
        )
        return { cases }
      }
    },
    {
      // TODO (scrapers): the above URL started being invalid at this date.
      // Cases went up from 32 to 3636 overnight, which is not valid.
      // The url here appears to be valid, at least as at May 20.
      startDate: '2020-03-31',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.co.monterey.ca.us/government/departments-a-h/health/diseases/2019-novel-coronavirus-2019-ncov/2019-novel-coronavirus-2019-ncov-local-data',
        },
      ],
      // eslint-disable-next-line
      scrape ($) {
        return { cases: undefined }
      }
    }
  ]
}
