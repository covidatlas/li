const assertTotalsAreReasonable = require('../../utils/assert-totals-are-reasonable.js')
const buildGetIso2FromName = require('../../utils/build-get-iso2-from-name.js')
const getKey = require('../../utils/get-key.js')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:AU'
const specialCases = {}

const getIsoFromName = buildGetIso2FromName({ country, specialCases })

const labelFragmentsByKey = [{ state: 'location' }, { cases: 'confirmed cases' }]

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'Australian Government Department of Health',
    url: 'https://www.health.gov.au/'
  },
  maintainers: [maintainers.camjc],
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
      scrape($) {
        const $table = $('.health-table__responsive > table')

        const $headings = $table.find('tr th')
        const dataKeysByColumnIndex = []
        $headings.each((index, heading) => {
          const $heading = $(heading)
          dataKeysByColumnIndex[index] = getKey({ label: $heading.text(), labelFragmentsByKey })
        })

        const $trs = $table.find(`tbody > tr:not(:contains("confirmed cases")):not(:contains("Total"))`)

        const states = []
        $trs.each((rowIndex, tr) => {
          const data = {}
          const $tds = $(tr).find('td')
          $tds.each((columnIndex, td) => {
            const key = dataKeysByColumnIndex[columnIndex]
            data[key] = $(td).text()
          })

          states.push({
            state: getIsoFromName(parse.string(data.state)),
            cases: parse.number(data.cases)
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
