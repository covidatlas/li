// Migrated from coronadatascraper, src/shared/scrapers/US/CA/san-diego-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06073',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
        },
      ],
      scrape ($) {
        let cases = 0
        $('td:contains("Positive (confirmed cases)")')
          .nextAll('td')
          .each((index, td) => {
            cases += parse.number($(td).text())
          })
        $('td:contains("Presumptive Positive")')
          .nextAll('td')
          .each((index, td) => {
            cases += parse.number($(td).text())
          })
        return {
          cases,
          tested: parse.number(
            $('td:contains("Total Tested")')
              .next('td')
              .text()
          )
        }
      }
    },
    {
      startDate: '2020-03-15',
      crawl: [
        {
          type: 'page',
          url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('td:contains("Total Positives")')
            .next()
            .text()
        )
        const deaths = parse.number(
          $('td:contains("Deaths")')
            .next()
            .text()
        )
        return {
          cases,
          deaths
        }

      }
    }
  ]
}
