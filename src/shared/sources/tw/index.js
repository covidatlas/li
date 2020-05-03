const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const datetime = require('../../datetime/index.js')

const country = `iso1:TW`

const dateKeyForTested = '通報日'
const dateKeyForRecovered = '發病日'

const cumulateObject = items =>
  items.reduce((previous, item) => {
    const newObject = { ...previous }
    for (const [ key, value ] of Object.entries(item)) {
      if (typeof value === 'string' && value.includes('/')) {
        continue
      }
      if (!newObject[key]) {
        newObject[key] = value
        continue
      }
      newObject[key] += value
    }
    return newObject
  }, {})


module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'Taiwan CDC',
    url: 'https://cdc.gov.tw/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-01-15',
      crawl: [
        {
          type: 'json',
          url: 'https://covid19dashboard.cdc.gov.tw/dash4',
          name: 'tested'
        },
        {
          type: 'json',
          url: 'https://covid19dashboard.cdc.gov.tw/dash5',
          name: 'recovered'
        }
      ],
      scrape ({ tested, recovered }, date) {
        const currentTestedItems = Object.values(tested).filter(
          item => datetime.dateIsBeforeOrEqualTo(datetime.parse(item[dateKeyForTested]), date)
        )
        const reducedTestedData = cumulateObject(currentTestedItems)

        const currentRecoveredItems = Object.values(recovered).filter(
          item => datetime.dateIsBeforeOrEqualTo(datetime.parse(item[dateKeyForRecovered]), date)
        )
        const reducedRecoveredData = cumulateObject(currentRecoveredItems)
        const data = {
          recovered: reducedRecoveredData['境外移入'],
          tested: reducedTestedData.Total
        }
        console.table(data)

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
