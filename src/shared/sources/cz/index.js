const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const timeseriesFilter = require('../_lib/timeseries-filter.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:CZ'

// Yes, there is a weird character here, it is intentional
const dateKeyForCasesCsv = '﻿datum_hlaseni'
const dateKeyForTestCSV = '﻿datum'

const regionKey = "kraj"
const testsKey = "testy_celkem"

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  priority: 1,
  friendly: {
    name: 'Ministry of Health of the Czech Republic',
    url: 'https://onemocneni-aktualne.mzcr.cz/',
  },
  maintainers: [ maintainers.camjc, maintainers.jzohrab ],
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'csv',
          name: 'cases',
          url: 'https://onemocneni-aktualne.mzcr.cz/api/v1/covid-19/osoby.csv'
        },
        {
          type: 'csv',
          name: 'tested',
          url: 'https://onemocneni-aktualne.mzcr.cz/api/v1/covid-19/testy.csv'
        }
      ],
      scrape ({ cases, tested }, date) {
        const casesByRegion = {}

        const cfilt = timeseriesFilter(cases, dateKeyForCasesCsv, (s) => s, date)
        for (const item of cases.filter(cfilt.func)) {
          casesByRegion[item[regionKey]] = 1 + (casesByRegion[item[regionKey]] || 0)
        }

        let numTests
        const tfilt = timeseriesFilter(tested, dateKeyForTestCSV, (s) => s, date)
        for (const item of tested.filter(tfilt.func)) {
          numTests = parse.number(item[testsKey])
        }

        const data = []

        for (const region of Object.keys(casesByRegion)) {
          data.push({
            state: `iso2:CZ-${region.substring(3, 7)}`,
            cases: casesByRegion[region]
          })
        }

        const summedData = transform.sumData(data, { tested: numTests })
        if (numTests || data.length > 0) data.push(summedData)
        assert(summedData.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
