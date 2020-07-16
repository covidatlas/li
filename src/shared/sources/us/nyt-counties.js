// Migrated from coronadatascraper, src/shared/scrapers/US/nyt-counties.js


const srcShared = '../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

module.exports = {
  country: 'iso1:US',
  timeseries: true,
  aggregate: 'county',
  priority: -1,
  maintainers: [ maintainers.jzohrab, maintainers.lazd ],
  tz: 'America/New_York',
  curators: [
    {
      name: 'The New York Times',
      url: 'http://nytimes.com/',
      twitter: '@nytimes',
      github: 'nytimes',
    },
  ],
  scrapers: [
    {
      startDate: '2020-01-21',
      crawl: [
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv',
        },
      ],
      scrape (data, date) {

        // This dataset already records the date as YYYY-MM-DD, return it as-is.
        const toYYYYMMDD = (datestring) => datestring

        const { filterDate, func } = timeseriesFilter(data, 'date', toYYYYMMDD, date)

        const counties = data.filter(func).
              filter(row => row.fips && row.state).
              map(row => {
                return {
                  county: `fips:${row.fips}`,
                  state: row.state,
                  cases: parse.number(row.cases),
                  deaths: parse.number(row.deaths),
                  date: filterDate
                }
              })

        // Rollup states
        const stateNames = [ ...new Set(counties.map(loc => loc.state)) ]
        const states = stateNames.map(state => {
          const rec = transform.sumData(counties.filter(loc => loc.state === state), { state })
          rec.date = filterDate
          return rec
        })

        const allRecords = counties.concat(states)
        return allRecords
      }
    }
  ]
}
