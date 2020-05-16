const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')
const { UNASSIGNED } = require('../_lib/constants.js')

const country = 'iso1:NZ'

const schemaKeysByHeadingFragment = {
  total: null,
  'last 24 hours': null,
  deceased: 'deaths',
  recovered: 'recovered',
  active: 'cases',
  dhb: 'state'
}

const nameToCanonical = { // Name differences get mapped to the canonical names
  'Capital and Coast': UNASSIGNED,
  'Counties Manukau': UNASSIGNED,
  'Hutt Valley': UNASSIGNED,
  'Lakes': UNASSIGNED,
  'Mid Central': UNASSIGNED,
  'Nelson Marlborough': UNASSIGNED,
  'South Canterbury': UNASSIGNED,
  'Southern': UNASSIGNED,
  'Tairāwhiti': UNASSIGNED,
  'Wairarapa': UNASSIGNED,
  'Waitematā': UNASSIGNED
}

module.exports = {
  aggregate: 'state',
  country,
  friendly: {
    name: 'New Zealand Government Ministry of Health',
    url: 'https://www.health.govt.nz'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-04-07',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://www.health.govt.nz/our-work/diseases-and-conditions/covid-19-novel-coronavirus/covid-19-current-situation/covid-19-current-cases'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, getSchemaKeyFromHeading, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: 'table:contains("Total cases by DHB")' })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        const dataRows = normalizedTable.slice(1, -1)

        const statesCount = 20
        assert.equal(dataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        dataRows.forEach(row => {
          const stateData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            stateData[key] = value
          })
          states.push({
            state: getIso2FromName({ country, name: stateData.state, nameToCanonical }),
            cases: parse.number(stateData.cases),
            deaths: parse.number(stateData.deaths),
            recovered: parse.number(stateData.recovered)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases')
        const tableWithoutHeadingRow = normalizedTable.slice(1)
        const casesFromTotalRow = parse.number(
          tableWithoutHeadingRow.find(row => row.some(cell => cell === 'Total'))[indexForCases]
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
