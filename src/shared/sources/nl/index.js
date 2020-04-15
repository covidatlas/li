const parse = require('../_lib/parse.js')
const datetime = require('../../datetime/index.js')
const transform = require('../_lib/transform.js')
const maintainers = require('../_lib/maintainers.js')

const mapping = require('./mapping.json')

module.exports = {
  country: 'iso1:NL',
  url: 'https://github.com/J535D165/CoronaWatchNL',
  timeseries: true,
  priority: 1,
  type: 'csv',
  friendly: {
    name: 'National Institute for Public Health and the Environment',
    url: 'https://github.com/J535D165/CoronaWatchNL',
  },
  maintainers: [maintainers.qgolsteyn],
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
      scrape ({ provinces, national }, date) {

        const casesData = provinces.filter(item => date === item.Datum)

        const hospitalized = national.find(item => date === item.Datum && item.Type === 'Ziekenhuisopname')

        const deaths = national.find(item => date === item.Datum && item.Type === 'Overleden')

        const casesByProvince = {}

        for (const item of casesData) {
          if (datetime.dateIsBeforeOrEqualTo(item.Datum, date) && item.Provincienaam) {
            casesByProvince[item.Provincienaam] = parse.number(item.Aantal)
          }
        }

        const data = []

        for (const region of Object.keys(casesByProvince)) {
          data.push({
            state: mapping[region],
            cases: casesByProvince[region]
          })
        }

        if (hospitalized || deaths || data.length > 0)
          data.push(
            transform.sumData(data, {
              hospitalized: hospitalized ? parse.number(hospitalized.Aantal) : undefined,
              deaths: deaths ? parse.number(deaths.Aantal) : undefined
            })
          )

        return data
      }
    }
  ]
}
