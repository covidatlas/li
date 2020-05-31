// Migrated from coronadatascraper, src/shared/scrapers/US/NV/clark-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'Clark County',
  state: 'iso2:US-NV',
  country: 'iso1:US',
  maintainers: [ maintainers.jzohrab ],
  friendly: {
    name: 'Southern Nevada Health District',
    url: 'https://www.southernnevadahealthdistrict.org',
    description: 'Southern Nevada health department',
  },
  scrapers: [
    {
      startDate: '2020-03-24',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.southernnevadahealthdistrict.org/coronavirus',
        },
      ],
      scrape ($) {
        const $h1 = $('h1:contains("Total Cases:")')
        const regexCases = /Total Cases: (\d+)/
        const cases = parse.number(regexCases.exec($h1[0].children[0].data)[1])
        const $td = $('td:contains("Deaths")').next()
        const deaths = parse.number($td[0].children[0].data)
        return {
          cases,
          deaths
        }
      }
    },
    {
      startDate: '2020-03-25',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.southernnevadahealthdistrict.org/coronavirus',
        },
      ],
      scrape ($) {
        const casesText = $('*:contains("Total Cases:")').text()
        const regexCases = /Total Cases: (\d+)/
        const cases = parse.number(regexCases.exec(casesText)[1])
        const deathsText = $('*:contains("Total Deaths:")').text()
        const regexDeaths = /Total Deaths: (\d+)/
        const deaths = parse.number(regexDeaths.exec(deathsText)[1])
        return {
          cases,
          deaths
        }
      }
    }
  ]
}
