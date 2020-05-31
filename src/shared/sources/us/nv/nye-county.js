// Migrated from coronadatascraper, src/shared/scrapers/US/NV/nye-county.js


const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const assert = require('assert')

module.exports = {
  county: 'fips:32023',
  country: 'iso1:US',
  state: 'iso2:US-NV',
  aggregate: 'county',
  timeseries: false,
  certValidation: false,
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    name: 'Coronavirus (COVID-19) Information | Nye County, NV Official Website',
    url: 'https://www.nyecounty.net/',
    description: 'County Department of Emergency Management and County Administration.',
  },
  scrapers: [
    {
      startDate: '2020-05-12',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.nyecounty.net/1066/Coronavirus-COVID-19-Information',
        },
      ],
      scrape ($) {
        const table = $('table', '#page')
        assert.equal(table.length, 1, 'Table not found')
        const rows = table.find('tbody tr')
        const approximateTests = parse.number(
          table
            .find('caption')
            .text()
            .match(/[^\D]([,0-9]+)\./)[0]
        )

        const countyData = {
          county: this.county,
          cases: 0,
          tested: typeof approximateTests === 'number' ? approximateTests : undefined,
          recovered: 0
        }

        // Collecting cities, but not returning them, in case we want
        // to use them in the future.
        const cities = []
        $(rows).each(function (i, row) {
          const c = $(row).find('td')
          if (c.eq(0).text() === 'Deaths') {
            countyData.deaths = parse.number(c.eq(1).text())
          } else {
            const city = {
              city: parse.string(c.eq(0).text()),
              cases: parse.number(c.eq(1).text() || undefined),
              recovered: parse.number(c.eq(2).text() || undefined)
            }
            countyData.cases += city.cases
            countyData.recovered += city.recovered
            cities.push(city)
          }
        })

        // console.info(cities)
        // console.info(countyData)
        return [ countyData ]
      }
    }
  ]
}
