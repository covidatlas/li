const assert = require('assert')
const datetime = require('../../datetime/index.js')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js'
)
const country = `iso1:UA`

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'National Security and Defense Council of Ukraine',
    url: 'https://www.rnbo.gov.ua/en/',
  },
  maintainers: [ maintainers.ciscorucinski, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-01-01',
      crawl: [
        {
          type: 'json',
          url: () => {
            const baseUrl = 'https://api-covid19.rnbo.gov.ua/data?to='
            const localDate = datetime.cast(null, 'Europe/Kiev')
            const formattedDate = datetime.getYYYYMMDD(localDate)
            return { url: baseUrl + formattedDate }
          }
        },
      ],
      scrape ($, date, { getIso2FromName }) {
        const states = []

        const getIso2inUA = (name) => {
          if (name === 'Kyiv') {
            return 'iso2:UA-30'
          }
          if (name === 'Kyivska') {
            return 'iso2:UA-32'
          }
          if (name === 'Chernivetska') {
            return 'iso2:UA-77'
          }
          const unSkaName = name
            .replace('nska', '')
            .replace('skа', '')
            .replace('ska', '')
            .replace('zka', '')
          return getIso2FromName({ country, name: unSkaName })
        }

        for (const state of $.ukraine) {
          states.push({
            state: getIso2inUA(state.label.en),
            cases: parse.number(state.confirmed),
            deaths: parse.number(state.deaths),
            recovered: parse.number(state.recovered)
          })
        }
        const summedData = transform.sumData(states)
        states.push(summedData)
        assert(summedData.cases > 0, 'Cases are not reasonable')
        return states
      }
    }
  ]
}
