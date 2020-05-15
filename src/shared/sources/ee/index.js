const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:EE'

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  friendly: {
    name: 'Estonia Health and Welfare Information Systems Center',
    url: 'https://www.terviseamet.ee/et/koroonaviirus/avaandmed'
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-24',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.digilugu.ee/opendata_covid19_test_results.csv'
        }
      ],
      scrape ($, date, { getIso2FromName }) {

        const testedByState = {}
        const casesByState = {}

        let nationalTestCount
        let nationalCasesCount
        const thisDatesItems = $.filter(item => item.StatisticsDate === date)
        for (const item of thisDatesItems) {
          if (item.County) {
            testedByState[item.County] = 1 + (testedByState[item.County] || 0)
            casesByState[item.County] = (item.ResultValue === 'P' ? 1 : 0) + (casesByState[item.County] || 0)
          } else {
            nationalCasesCount = (item.ResultValue === 'P' ? 1 : 0) + (nationalCasesCount || 0)
            nationalTestCount = 1 + (nationalTestCount || 0)
          }
        }

        const data = []
        for (const stateName of Object.keys(testedByState)) {
          data.push({
            state: getIso2FromName({ country, name: stateName }),
            tested: testedByState[stateName],
            cases: casesByState[stateName]
          })
        }

        const summedData = transform.sumData(data, {
          tested: nationalTestCount,
          cases: nationalCasesCount
        })
        assert(summedData.cases > 0, 'Cases are not reasonable')
        data.push(summedData)

        return data
      }
    }
  ]
}
