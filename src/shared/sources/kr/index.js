const assert = require('assert')
const assertTotalsAreReasonable = require('../../utils/assert-totals-are-reasonable.js')
const buildGetIso2FromName = require('../../utils/build-get-iso2-from-name.js')
const getKey = require('../../utils/get-key.js')
const maintainers = require('../_lib/maintainers.js')
const normalizeTable = require('../../utils/normalize-table.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const UNASSIGNED = '(unassigned)'

const country = 'iso1:KR'
const getIso2FromName = buildGetIso2FromName({ country })

const labelFragmentsByKey = [
  { discard: 'daily change' },
  { discard: 'imported cases' },
  { discard: 'local outbreak' },
  { discard: 'isolated' },
  { discard: 'incidence' },
  { state: 'city/province' },
  { cases: 'confirmed cases' },
  { deaths: 'deceased' },
  { recovered: 'released from quarantine' }
]

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
      scrape ($) {
        const normalizedTable = normalizeTable({ $, tableSelector: 'table.num' })

        const headingRowIndex = 1
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getKey({ label: heading, labelFragmentsByKey })
        })

        const dataRows = normalizedTable.slice(3)

        const statesCount = 18
        assert.equal(dataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        dataRows.forEach((row) => {
          const stateData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName(stateData.state.replace('Lazaretto', UNASSIGNED)),
            cases: parse.number(stateData.cases.replace('-', 0)),
            deaths: parse.number(stateData.deaths),
            recovered: parse.number(stateData.recovered)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const indexForCases = dataKeysByColumnIndex.findIndex(key => key === 'cases')
        const casesFromTotalRow = parse.number(normalizedTable.find(row => row.some(column => column === 'Total'))[indexForCases])
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
