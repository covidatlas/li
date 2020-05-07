const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')
const transform = require('../../_lib/transform.js')

// WA Health has Death counts for the whole country by state,
// even though the federal government doesn't in an accessible format.
// It seems slightly delayed compared to the federal government case count.

const country = 'iso1:AU'

const schemaKeysByHeadingFragment = { deaths: 'deaths', state: 'state', cases: 'cases' }

module.exports = {
  aggregate: 'state',
  country,
  priority: 0.5,
  friendly: {
    name: 'Government of Western Australia, Department of Health',
    url: 'https://ww2.health.wa.gov.au'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-04-04',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://ww2.health.wa.gov.au/Articles/A_E/Coronavirus/COVID19-statistics'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, getSchemaKeyFromHeading, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: 'h2:contains("in Australia") + table' })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.slice(1, -1)

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
            cases: parse.number(stateData.cases),
            deaths: parse.number(stateData.deaths)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases')
        const casesFromTotalRow = parse.number(
          normalizedTable.find(row => row.some(cell => cell === 'Total'))[indexForCases]
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
