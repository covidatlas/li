// Migrated from coronadatascraper, src/shared/scrapers/US/CA/mercury-news.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

module.exports = {
  state: 'iso2:US-CA',
  country: 'iso1:US',
  priority: 1,
  aggregate: 'county',
  timeseries: true,
  maintainers: [ maintainers.jzohrab ],
  curators: [
    {
      name: 'The Mercury News',
      email: 'hattierowan@gmail.com',
      twitter: '@hattierowan',
      github: 'HarrietRowan',
    },
  ],
  scrapers: [
    {
      startDate: '2020-03-20',  // earliest date in the spreadsheet.
      crawl: [
        {
          type: 'csv',
          url: 'https://docs.google.com/spreadsheets/d/1CwZA4RPNf_hUrwzNLyGGNHRlh1cwl8vDHwIoae51Hac/gviz/tq?tqx=out:csv&sheet=timeseries',
        },
      ],
      scrape (data, date) {

        // merc news reports date in proper format (e.g., "Date:
        // '2020-07-29'"), so return it as-is.
        function toYYYYMMDD (datestring) { return datestring }

        const { filterDate, func } = timeseriesFilter(data, 'Date', toYYYYMMDD, date)

        const counties = data.filter(func).map(row => {
          const record = {
            county: geography.addCounty(row.County),
            date: filterDate
          }
          const propToField = {
            cases: 'Cases Total',
            tested: 'Tests Total',
            recovered: 'Recovered Total',
            deaths: 'Deaths Total',
            hospitalized: 'Hospital Confirmed Total',
            hospitalized_current: 'Hospital Confirmed Current',
            icu: 'ICU Total',
            icu_current: 'ICU Current'
          }
          for (const [ k, f ] of Object.entries(propToField)) {
            if (row[f] !== '')
              record[k] = parse.number(row[f])
          }
          return record
        })

        if (counties.length === 0) {
          throw new Error(`Timeseries does not contain a sample for ${filterDate}`)
        }

        counties.push(transform.sumData(counties))
        return counties
      }
    }
  ]
}
