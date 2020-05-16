const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const datetime = require('../../datetime/index.js')
const transform = require('../_lib/transform.js')
const { UNASSIGNED } = require('../_lib/constants.js')

const country = 'iso1:CA'

const parseOrUndefined = (value) => value ? parse.number(value) : undefined

const nameToCanonical = { // Name differences get mapped to the canonical names
  'Repatriated travellers': UNASSIGNED
}

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  friendly: {
    name: 'Public Health Agency of Canada',
    url: 'https://health-infobase.canada.ca/'
  },
  maintainers: [ maintainers.camjc ],
  priority: 1,
  scrapers: [
    {
      startDate: '2020-02-24',
      crawl: [
        {
          type: 'csv',
          url: 'https://health-infobase.canada.ca/src/data/covidLive/covid19.csv'
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        const states = $
          .filter(row => row.date === datetime.getDDMMYYYY(date))
          .filter(row => 'Canada' !== row.prname)
          .map(row => ({
            state: getIso2FromName({ country, name: row.prname, nameToCanonical }),
            cases: parseOrUndefined(row.numconf),
            deaths: parseOrUndefined(row.numdeaths),
            recovered: parseOrUndefined(row.numrecover),
            tested: parseOrUndefined(row.numtested),
          }))

        const summedData = transform.sumData(states)
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable for date: ' + date)
        return states
      }
    }
  ]
}
