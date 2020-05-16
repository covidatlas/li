// Migrated from coronadatascraper, src/shared/scrapers/CH/index.js

const srcShared = '../../'
const parse = require(srcShared + 'sources/_lib/parse.js')
const datetime = require(srcShared + 'datetime/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

const cantons = [
  'AG',
  'AI',
  'AR',
  'BE',
  'BL',
  'BS',
  'FR',
  'GE',
  'GL',
  'GR',
  'JU',
  'LU',
  'NE',
  'NW',
  'OW',
  'SG',
  'SH',
  'SO',
  'SZ',
  'TG',
  'TI',
  'UR',
  'VD',
  'VS',
  'ZG',
  'ZH'
]

module.exports = {
  country: 'iso1:CH',
  timeseries: true,
  priority: 1,
  maintainers: [ maintainers.qgolsteyn ],
  scrapers: [
    {
      startDate: '2020-02-25',
      crawl: [
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_cases_switzerland_openzh.csv',
          name: 'cases',
        },
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_fatalities_switzerland_openzh.csv',
          name: 'deaths',
        },
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_hospitalized_switzerland_openzh.csv',
          name: 'hospitalized',
        },
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_released_switzerland_openzh.csv',
          name: 'released',
        },
      ],
      scrape (data, date) {

        const dataByCanton = {}
        // Initialize
        for (const canton of cantons) {
          dataByCanton[canton] = {
            state: `iso2:CH-${canton}`
          }
        }
        for (const item of data.cases) {
          if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
            for (const canton of cantons) {
              dataByCanton[canton].cases = parse.float(item[canton]) || dataByCanton[canton].cases
            }
          }
        }
        for (const item of data.deaths) {
          if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
            for (const canton of cantons) {
              dataByCanton[canton].deaths = parse.float(item[canton]) || dataByCanton[canton].deaths
            }
          }
        }
        for (const item of data.hospitalized) {
          if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
            for (const canton of cantons) {
              dataByCanton[canton].hospitalized = parse.float(item[canton]) || dataByCanton[canton].hospitalized
            }
          }
        }
        for (const item of data.released) {
          if (datetime.dateIsBeforeOrEqualTo(item.Date, date)) {
            for (const canton of cantons) {
              dataByCanton[canton].discharged = parse.float(item[canton]) || dataByCanton[canton].discharged
            }
          }
        }
        const result = Object.values(dataByCanton)
        result.push(transform.sumData(data))
        return result

      }
    },
  ]
}
