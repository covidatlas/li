const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:AU'

const mapping = {
  state: [ 'jurisdiction', 'location' ],
  cases: 'confirmed cases',
  deaths: 'deaths',
}

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'Australian Government Department of Health',
    url: 'https://www.health.gov.au/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-23',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://www.health.gov.au/news/health-alerts/novel-coronavirus-2019-ncov-health-alert/coronavirus-covid-19-current-situation-and-case-numbers'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, normalizeKey, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '.health-table__responsive > table' })

        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[0], mapping)

        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.slice(1, -2)

        const statesCount = 8
        assert.equal(stateDataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        stateDataRows.forEach((row) => {
          const stateData = normalizeKey.createHash(propColIndices, row)
          stateData.state = getIso2FromName({ country, name: stateData.state })
          states.push(stateData)
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const casesFromTotalRow = parse.number(
          normalizedTable.find((row) => row.some(cell => cell === 'Total'))[propColIndices.cases]
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    },
    {
      // TODO (scrapers) Fix au scraper, currently it doesn't work.
      startDate: '2020-04-02',
      crawl: [
        {
          type: 'headless',
          timeout: 15000,
          data: 'table',
          url: 'https://www.health.gov.au/resources/total-covid-19-cases-and-deaths-by-states-and-territories'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, normalizeKey, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '.ng-scope table' })
        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[0], mapping)

        const totalLabel = 'Australia'
        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.filter((row) =>
          row.every(cell => cell !== totalLabel && cell !== 'Jurisdiction')
        )

        const statesCount = 8
        assert.equal(stateDataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        stateDataRows.forEach((row) => {
          const stateData = normalizeKey.createHash(propColIndices, row)
          stateData.state = 'iso2:AU-' + stateData.state
          states.push(stateData)
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const casesFromTotalRow = parse.number(
          normalizedTable.find((row) => row.some(cell => cell === totalLabel))[propColIndices.cases]
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
