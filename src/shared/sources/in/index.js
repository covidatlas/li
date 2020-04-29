const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:IN'

const schemaKeysByHeadingFragment = {
  'name of state': 'state',
  'death': 'deaths',
  'total confirmed cases': 'cases',
  'cured': 'recovered',
  's. no.': null,
}

module.exports = {
  aggregate: 'state',
  country,
  friendly: {
    name: 'Ministry of Health and Family Welfare, Government of India',
    url: 'https://www.mohfw.gov.in/'
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
            'https://www.mohfw.gov.in/'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, getSchemaKeyFromHeading, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '#state-data' })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.slice(1, 33)

        const statesCount = 32
        assert.equal(stateDataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        stateDataRows.forEach((row) => {
          const stateData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName({ country, name: stateData.state.replace('Telengana', 'Telangana') }),
            cases: parse.number(stateData.cases),
            deaths: parse.number(stateData.deaths),
            recovered: parse.number(stateData.recovered)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases')
        const casesFromTotalRow = parse.number(normalizedTable.find(row => row.some(column => column === 'Total number of confirmed cases in India'))[indexForCases])
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
