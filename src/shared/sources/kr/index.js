const assert = require('assert')
const assertTotalsAreReasonable = require('../../utils/assert-totals-are-reasonable.js')
const buildGetIso2FromName = require('../../utils/build-get-iso2-from-name.js')
const getKey = require('../../utils/get-key.js')
const maintainers = require('../_lib/maintainers.js')
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
        const $table = $('table.num')

        const $headings = $table.find('thead tr:last-child th')

        const dataKeysByColumnIndex = [ 'state' ]
        const columnOffsetForRowSpanState = 1
        $headings.each((index, heading) => {
          const $heading = $(heading)
          dataKeysByColumnIndex[index + columnOffsetForRowSpanState] = getKey({ label: $heading.text(), labelFragmentsByKey })
        })

        const $trs = $table.find(`tbody > tr:not(.sumline)`)
        const statesCount = 18
        assert.equal($trs.length, statesCount, 'Wrong number of TRs found')

        let states = []
        $trs.each((rowIndex, tr) => {
          const $tds = $(tr).find('th, td')
          assert.equal($tds.length, dataKeysByColumnIndex.length, 'A row is missing column/s')

          const stateData = {}
          $tds.each((columnIndex, td) => {
            const key = dataKeysByColumnIndex[columnIndex]
            const value = $(td).text()
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName(stateData.state.replace('Lazaretto', UNASSIGNED)),
            cases: parse.number(stateData.cases.replace('-', 0))
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        states = states.filter(s => s.state !== UNASSIGNED)

        const nthChildForCases = 1 + dataKeysByColumnIndex.findIndex(key => key === 'cases')
        const casesFromTotalRow = parse.number(
          $table.find(`tbody > tr:contains("Total") > td:nth-child(${nthChildForCases})`).text()
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
