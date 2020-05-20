// Migrated from coronadatascraper, src/shared/scrapers/US/CA/mercury-news.js

const srcShared = '../../../'
const datetime = require(srcShared + 'datetime/index.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
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
        let dateString = datetime.getYYYYMMDD(date)

        const lastDate = data[0].Date
        if (date > lastDate) {
          const msg = `${dateString} is newer than last sample ${lastDate}`
          console.error(`  🚨 ${msg}.   Using last sample anyway.`)
          dateString = lastDate
        }

        const firstDate = data[data.length - 1].Date
        if (date < firstDate) {
          throw new Error(`Timeseries starts at ${firstDate}, but date is ${dateString}`)
        }

        const counties = []
        for (const stateData of data.filter(d => d.Date === dateString)) {
          const record = { county: geography.addCounty(stateData.County) }
          const propToField = {
            cases: 'Cases Total',
            tested: 'Tests Total',
            recovered: 'Recovered Total',
            deaths: 'Deaths Total',
            hospitalized: 'Hospital Confirmed Total',
            icu: 'ICU Total'
          }
          for (const [ k, f ] of Object.entries(propToField)) {
            if (stateData[k] !== '')
              record[k] = parse.number(stateData[f])
          }
          counties.push(record)
        }

        if (counties.length === 0) {
          throw new Error(`Timeseries does not contain a sample for ${dateString}`)
        }

        counties.push(transform.sumData(counties))
        return counties
      }
    }
  ]
}
