const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:AU'

const schemaKeysByHeadingFragment = { 'location': 'state', 'confirmed cases': 'cases' }

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
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, getSchemaKeyFromHeading, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '.health-table__responsive > table' })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.slice(1, -2)

        const statesCount = 8
        assert.equal(stateDataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        stateDataRows.forEach((row) => {
          const stateData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName({ country, name: stateData.state }),
            cases: parse.number(stateData.cases)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)
        console.table(states)

        const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases')
        const casesFromTotalRow = parse.number(normalizedTable.find(row => row.some(column => column === 'Total'))[indexForCases])
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
