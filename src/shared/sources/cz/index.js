const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:IT'

// Yes, there is a weird character here, it is intentional
const dateKey = '﻿datum'

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  priority: 1,
  friendly: {
    name: 'Ministry of Health of the Czech Republic',
    url: 'https://onemocneni-aktualne.mzcr.cz/',
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-29',
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

        for (const item of cases) {
          if (item[dateKey] === date) {
            casesByRegion[item.kraj] = 1 + (casesByRegion[item.kraj] || 0)
          }
        }

        let numTests
        for (const item of tested) {
          if (item[dateKey] === date) {
            numTests = parse.number(item.testy_celkem)
          }
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
