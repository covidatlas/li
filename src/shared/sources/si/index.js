const datetime = require('../../datetime/index.js')
const maintainers = require('../_lib/maintainers.js')
const mapping = require('./mapping.json')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:SI'

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'COVID-19 Sledilnik',
    url: 'https://covid-19.sledilnik.org/',
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-24',
      crawl: [
        {
          name: 'cases',
          type: 'csv',
          url:
            'https://raw.githubusercontent.com/slo-covid-19/data/master/csv/stats.csv'
        },
        {
          name: 'region',
          type: 'csv',
          url:
            'https://raw.githubusercontent.com/slo-covid-19/data/master/csv/regions.csv'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable }) {
        let nationalData = {}

        for (const item of $.cases) {
          if (datetime.dateIsBeforeOrEqualTo(item.date, date)) {
            nationalData = {
              tested: parse.number(item['tests.performed.todate']) || nationalData.tested,
              cases: parse.number(item['cases.confirmed.todate']) || nationalData.cases,
              hospitalized: parse.number(item['state.in_hospital.todate']) || nationalData.hospitalized,
              discharged: parse.number(item['state.out_of_hospital.todate']) || nationalData.discharged,
              deaths: parse.number(item['state.deceased.todate']) || nationalData.deaths,
              recovered: parse.number(item['state.recovered.todate']) || nationalData.recovered
            }
          }
        }

        const casesByRegion = {}
        for (const item of $.region) {
          if (datetime.dateIsBeforeOrEqualTo(item.date, date)) {
            for (const region of Object.keys(mapping)) {
              casesByRegion[region] = item[region] ? parse.number(item[region]) : casesByRegion[region]
            }
          }
        }

        const data = []

        for (const region of Object.keys(mapping)) {
          if (mapping[region]) {
            data.push({
              state: mapping[region],
              cases: casesByRegion[region]
            })
          }
        }

        const summedData = { ...nationalData, ...transform.sumData(data) }

        assertTotalsAreReasonable({ computed: summedData.cases, scraped: nationalData.cases })
        data.push(summedData)
        return data
      }
    }
  ]
}
