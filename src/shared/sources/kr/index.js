const assert = require('assert')
const assertTotalsAreReasonable = require('../../utils/assert-totals-are-reasonable.js')
const getKey = require('../../utils/get-key.js')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const UNASSIGNED = '(unassigned)'

const country = 'iso1:KR'
const countryLevelMap = {
  Busan: 'iso2:KR-26',
  'Chungcheongbuk-do': 'iso2:KR-43',
  'Chungcheongnam-do': 'iso2:KR-44',
  Daegu: 'iso2:KR-27',
  Daejeon: 'iso2:KR-30',
  'Gangwon-do': 'iso2:KR-42',
  Gwangju: 'iso2:KR-29',
  'Gyeonggi-do': 'iso2:KR-41',
  'Gyeongsangbuk-do': 'iso2:KR-47',
  'Gyeongsangnam-do': 'iso2:KR-48',
  Incheon: 'iso2:KR-28',
  Jeju: 'iso2:KR-49',
  'Jeollabuk-do': 'iso2:KR-45',
  'Jeollanam-do': 'iso2:KR-46',
  Sejong: 'iso2:KR-50',
  Seoul: 'iso2:KR-11',
  Ulsan: 'iso2:KR-31',
  Lazaretto: UNASSIGNED // Maritime quarantine
}

/**
 * @param {string} name - Name of the state.
 * @returns {string} - an iso2 ID.
 */
const getIso2FromName = (name) => countryLevelMap[name]

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
            state: getIso2FromName(parse.string(stateData.state)),
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
