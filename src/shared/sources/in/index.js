const assert = require('assert')
const assertTotalsAreReasonable = require('../../utils/assert-totals-are-reasonable.js')
const buildGetIso2FromName = require('../../utils/build-get-iso2-from-name.js')
const getKey = require('../../utils/get-key.js')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:IN'
const getIso2FromName = buildGetIso2FromName({ country })

const labelFragmentsByKey = [
  { state: 'name of state' },
  { deaths: 'death' },
  { cases: 'total confirmed cases' },
  { recovered: 'cured' },
  { discard: 's. no.' }
]

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
      scrape ($) {
        const $table = $('#state-data')

        const $headings = $table.find('thead tr th')
        const dataKeysByColumnIndex = []
        $headings.each((index, heading) => {
          const $heading = $(heading)
          dataKeysByColumnIndex[index] = getKey({ label: $heading.text(), labelFragmentsByKey })
        })

        const $trs = $table.find(`tbody > tr`)

        const states = []
        $trs.filter(
          // Remove summary rows
          (_rowIndex, tr) =>
            !$(tr)
              .find('td')
              .first()
              .attr('colspan')
        ).each((rowIndex, tr) => {
          const $tds = $(tr).find('td')
          assert.equal($tds.length, dataKeysByColumnIndex.length, 'A row is missing column/s')

          const stateData = {}
          $tds.each((columnIndex, td) => {
            const key = dataKeysByColumnIndex[columnIndex]
            const value = $(td).text()
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName(stateData.state.replace('Telengana', 'Telangana')),
            cases: parse.number(stateData.cases)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const accountForTotalRowColSpan = -1
        const nthChildForCases = 1 + dataKeysByColumnIndex.findIndex(key => key === 'cases') + accountForTotalRowColSpan
        const casesFromTotalRow = parse.number(
          $table.find(`tbody > tr:contains("Total") > td:nth-child(${nthChildForCases})`).text()
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
