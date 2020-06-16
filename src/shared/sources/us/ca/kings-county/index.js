const assert = require('assert')
const parse = require('../../../_lib/parse.js')
const maintainers = require('../../../_lib/maintainers.js')

const crawl = [
  {
    data: 'paragraph',
    type: 'page',
    url: 'https://www.countyofkings.com/departments/health-welfare/public-health/coronavirus-disease-2019-covid-19/-fsiteid-1',
  },
]

const mapping = {
  cases: 'total cases',
  deaths: 'deaths',
  recovered: 'recovered'
}

module.exports = {
  county: 'Kings County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  priority: 2,
  maintainers: [ maintainers.jbencina, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-16',
      crawl,
      scrape ($) {
        const cases = parse.number(
          $('h3:contains("Confirmed Cases")')
            .text()
            .match(/Confirmed Cases: (\d+)/)[1]
        )
        return { cases }
      }
    },
    {
      startDate: '2020-04-13',
      crawl,
      scrape ($, date, { normalizeKey }) {
        const $rows = $('ul:contains("Total Cases") > li')
        const data = {}
        $rows.each((index, row) => {
          const $row = $(row)
          const [ heading, value ] = $row
            .text()
            .split('\n')[0]
            .split(': ')
          const key = normalizeKey.normalizeKey(heading, mapping)
          data[key] = parse.number(value)
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
