const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')
const geography = require('../_lib/geography/index.js')
const datetime = require('../../datetime/index.js')

module.exports = {
  country: 'iso1:US',
  timeseries: true,
  aggregate: 'county',
  priority: -1,
  tz: 'America/Los_Angeles',
  friendly: {
    name: 'The New York Times',
    url: 'https://github.com/nytimes/covid-19-data',
    twitter: '@nytimes',
    github: 'nytimes'
  },
  scrapers: [
    {
      startDate: '2020-01-21',
      crawl: [
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv'
        }
      ],
      scrape (data, date) {

        const lastDateInTimeseries = data[data.length - 1].date
        const firstDateInTimeseries = data[0].date

        if (date > lastDateInTimeseries) {
          console.error(
            `NYT timeseries: date ${date} is newer than last sample time ${lastDateInTimeseries}; using last sample anyway`
          )
          date = lastDateInTimeseries
        }

        if (date < firstDateInTimeseries) {
          throw new Error(`Timeseries starts later than SCRAPE_DATE ${datetime.getYYYYMD(date)}`)
        }

        const locations = []
        const locationsByState = {}
        for (const row of data) {

          if (row.date === date) {
            const locationObj = {
              state: geography.getState(row.state),
              cases: parse.number(row.cases),
              deaths: parse.number(row.deaths)
            }
            locationsByState[locationObj.state] = locationsByState[locationObj.state] || []
            if (row.county.toLowerCase().match(/city$/)) {
              // Data is not for a county
              // Todo: Check our citycounty to county map
              locationObj.city = row.county
            } else {
              locationObj.county = row.county //geography.getCounty(row.county, row.state)

              if (locationObj.county === '(unassigned)') {
                // Skip unassigned locations from NYT, otherwise they mess up rollup totals
                continue
              }
            }
            locationsByState[locationObj.state].push(locationObj)
            locations.push(locationObj)
          }
        }

        // Roll-up states
        for (const [state, stateLocations] of Object.entries(locationsByState)) {
          locations.push(transform.sumData(stateLocations, { state }))
        }

        if (locations.length === 0) {
          throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${date}`)
        }

        return locations
      }
    }
  ]
}
