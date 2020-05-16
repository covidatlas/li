const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')
const { UNASSIGNED } = require('../_lib/constants.js')

const country = 'iso1:KR'

const schemaKeysByHeadingFragment = {
  'daily change': null,
  'imported cases': null,
  'local outbreak': null,
  'isolated': null,
  'incidence': null,
  'city/province': 'state',
  'confirmed cases': 'cases',
  'deceased': 'deaths',
  'released from quarantine': 'recovered',
}

const nameToCanonical = { // Name differences get mapped to the canonical names
  'Lazaretto': UNASSIGNED
}

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'Ministry of Health and Welfare',
    url: 'http://ncov.mohw.go.kr/'
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
            'http://ncov.mohw.go.kr/en/bdBoardList.do?brdId=16&brdGubun=162&dataGubun=&ncvContSeq=&contSeq=&board_id='
        }
      ],
      scrape ($, date, helpers) {
        const { assertTotalsAreReasonable, getIso2FromName, getSchemaKeyFromHeading, normalizeTable } = helpers
        const normalizedTable = normalizeTable({ $, tableSelector: 'table.num' })

        const headingRowIndex = 1
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.slice(3)

        const statesCount = 18
        assert.equal(stateDataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        stateDataRows.forEach((row) => {
          const stateData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName({ country, name: stateData.state, nameToCanonical }),
            cases: parse.number(stateData.cases.replace('-', 0)),
            deaths: parse.number(stateData.deaths),
            recovered: parse.number(stateData.recovered)
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
