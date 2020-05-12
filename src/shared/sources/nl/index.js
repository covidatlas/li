const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:NL'

const countKey = 'Aantal'
const dateKey = 'Datum'
const stateKey = 'Provincienaam'

const deathsType = 'Overleden'
const hospitalizedType = 'Ziekenhuisopname'

module.exports = {
  country,
  timeseries: true,
  priority: 1,
  friendly: {
    name: 'National Institute for Public Health and the Environment',
    url: 'https://github.com/J535D165/CoronaWatchNL',
  },
  maintainers: [ maintainers.qgolsteyn ],
  scrapers: [
    {
      startDate: '2020-02-27', // As of 2020-04-14 this is when their timeseries dataset began
      crawl: [
        {
          type: 'csv',
          name: 'provinces',
          url: 'https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_NL_covid19_province.csv'
        },
        {
          type: 'csv',
          name: 'national',
          url: 'https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_NL_covid19_national.csv'
        }
      ],
      scrape ({ provinces, national }, date, { getIso2FromName }) {
        const casesData = provinces.filter(item => date === item[dateKey] && item[stateKey] && item[countKey])
        assert(casesData.length > 0, `no cases data found for ${date}`)

        const hospitalized = national.find(item => date === item[dateKey] && item.Type === hospitalizedType)

        const deaths = national.find(item => date === item[dateKey] && item.Type === deathsType)

        const data = []

        for (const item of casesData) {
          const name = item[stateKey].replace('Noord', 'North').replace('Zuid', 'South')

          data.push({
            state: getIso2FromName({ country, name }),
            cases: parse.number(item[countKey])
          })
        }

        data.push(
          transform.sumData(data, {
            hospitalized: hospitalized ? parse.number(hospitalized[countKey]) : undefined,
            deaths: deaths ? parse.number(deaths[countKey]) : undefined
          })
        )
        console.table(data)
        return data
      }
    }
  ]
}
