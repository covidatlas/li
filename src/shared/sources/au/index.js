const assert = require('assert')
const assertTotalsAreReasonable = require('../../utils/assert-totals-are-reasonable.js')
const getKey = require('../../utils/get-key.js')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:AU'
const countryLevelMap = {
  'Australian Capital Territory': 'iso2:AU-ACT',
  'New South Wales': 'iso2:AU-NSW',
  'Northern Territory': 'iso2:AU-NT',
  Queensland: 'iso2:AU-QLD',
  'South Australia': 'iso2:AU-SA',
  Tasmania: 'iso2:AU-TAS',
  Victoria: 'iso2:AU-VIC',
  'Western Australia': 'iso2:AU-WA'
}

/**
 * @param {string} name - Name of the state.
 * @returns {string} - an iso2 ID.
 */
const getIso2FromName = (name) => countryLevelMap[name]

const labelFragmentsByKey = [ { state: 'location' }, { cases: 'confirmed cases' } ]

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
      scrape ($) {
        const $table = $('.health-table__responsive > table')

        const $headings = $table.find('tr th')
        const dataKeysByColumnIndex = []
        $headings.each((index, heading) => {
          const $heading = $(heading)
          dataKeysByColumnIndex[index] = getKey({ label: $heading.text(), labelFragmentsByKey })
        })

        const $trs = $table.find(`tbody > tr:not(:first-child):not(:last-child)`)
        const statesCount = 8
        assert.equal($trs.length, statesCount, 'Wrong number of TRs found')

        const states = []
        $trs.each((rowIndex, tr) => {
          const $tds = $(tr).find('td')
          assert.equal($tds.length, dataKeysByColumnIndex.length, 'A row is missing column/s')

          const stateData = {}
          $tds.each((columnIndex, td) => {
            const key = dataKeysByColumnIndex[columnIndex]
            const value = $(td).text()
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName(parse.string(stateData.state)),
            cases: parse.number(stateData.cases)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

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
