// Migrated from coronadatascraper, src/shared/scrapers/US/CA/butte-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06007',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  friendly:   {
    url: 'https://www.buttecounty.net/publichealth',
    name: 'BCPHD',
    description: 'Butte County Public Health Department',
  },
  scrapers: [
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'page',
          url: 'https://www.buttecounty.net/publichealth',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('td:contains("Positive COVID-19 Tests")')
            .next()
            .text()
        )
        return { cases }
      }
    },
    {
      startDate: '2020-03-25',
      crawl: [
        {
          type: 'page',
          url: 'https://www.buttecounty.net/publichealth',
        },
      ],
      scrape ($) {
        const valueFor = title => {
          const v = $(`td:contains("${title}")`).next().text()
          return parseInt(v.trim(), 10)
        }
        return {
          cases: valueFor('Total COVID-19 Cases'),
          deaths: valueFor('Total COVID-19 Deaths')
        }
      }
    }

    // TODO (scrapers): hasn't returned data since '2020-03-24'
  ]
}
