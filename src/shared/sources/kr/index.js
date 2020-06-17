const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')
const { UNASSIGNED } = require('../_lib/constants.js')

const country = 'iso1:KR'

const mapping = {
  ignore: [ 'daily change', 'imported cases', 'local outbreak', 'isolated', 'incidence' ],
  state: 'city/province',
  cases: 'confirmed cases',
  deaths: 'deceased',
  recovered: 'released from quarantine'
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
        const { assertTotalsAreReasonable, getIso2FromName, normalizeKey, normalizeTable } = helpers
        const normalizedTable = normalizeTable({ $, tableSelector: 'table.num' })

        const headingRowIndex = 1
        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[headingRowIndex], mapping)

        // Create new array with just the state data (no headings, comments, totals)
        // TODO (scraper) ensure this is actually slicing the right things.
        const stateDataRows = normalizedTable.slice(3)

        const statesCount = 18
        assert.equal(stateDataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        stateDataRows.forEach((row) => {
          row[propColIndices.cases] = row[propColIndices.cases].replace('-', 0)
          const stateData = normalizeKey.createHash(propColIndices, row)
          stateData.state = getIso2FromName({ country, name: stateData.state, nameToCanonical })
          states.push(stateData)
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const indexForCases = propColIndices.cases
        const casesFromTotalRow = parse.number(
          normalizedTable.find(row => row.some(cell => cell === 'Total'))[indexForCases]
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
