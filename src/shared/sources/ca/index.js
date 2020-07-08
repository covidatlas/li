const assert = require('assert')
const timeseriesFilter = require('../_lib/timeseries-filter.js')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
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
      scrape (data, date, { getIso2FromName }) {

        // Canada uses DD-MM-YYYY, e.g. '29-06-2020'
        function toYYYYMMDD (datestring) {
          const [ d, m, y ] = datestring.split('-')
          return [ y, m, d ].join('-')
        }

        const { filterDate, func } = timeseriesFilter(data, 'date', toYYYYMMDD, date)

        const states = data
          .filter(func)
          .filter(row => 'Canada' !== row.prname)
          .map(row => ({
            state: getIso2FromName({ country, name: row.prname, nameToCanonical }),
            cases: parseOrUndefined(row.numconf),
            deaths: parseOrUndefined(row.numdeaths),
            recovered: parseOrUndefined(row.numrecover),
            tested: parseOrUndefined(row.numtested),
            date: filterDate
          }))

        const summedData = { ...transform.sumData(states), date: filterDate }
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable for date: ' + filterDate)
        return states
      }
    }
  ]
}
