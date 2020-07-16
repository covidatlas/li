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

        const locations = []
        const locationsByState = {}
        data.filter(func).
          filter(row => row.fips).
          forEach(row => {
            const locationObj = {
              county: `fips:${row.fips}`,
              state: row.state,
              cases: parse.number(row.cases),
              deaths: parse.number(row.deaths),
              date: filterDate
            }
            locationsByState[locationObj.state] = locationsByState[locationObj.state] || []
            locationsByState[locationObj.state].push(locationObj)
            locations.push(locationObj)
          })

        // Rollup states
        for (const [ state, stateLocations ] of Object.entries(locationsByState)) {
          const rec = transform.sumData(stateLocations, { state })
          rec.date = filterDate
          locations.push(rec)
        }
        return locations
      }
    }
  ]
}
