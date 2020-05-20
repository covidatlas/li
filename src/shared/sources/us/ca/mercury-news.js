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
      scrape (data, scrapeDate) {

        let scrapeDateString = datetime.getYYYYMMDD(scrapeDate)
        const lastDateInTimeseries = data[0].Date
        const firstDateInTimeseries = data[data.length - 1].Date
        if (scrapeDate > lastDateInTimeseries) {
          console.error(
            `  🚨 timeseries for Mercury News (CA): SCRAPE_DATE ${datetime.getYYYYMD(
          scrapeDate
        )} is newer than last sample time ${datetime.getYYYYMD(lastDateInTimeseries)}. Using last sample anyway`
          )
          scrapeDate = lastDateInTimeseries
          scrapeDateString = datetime.getYYYYMMDD(scrapeDate)
        }
        if (scrapeDate < firstDateInTimeseries) {
          throw new Error(
            `Timeseries starts at ${datetime.getYYYYMD(firstDateInTimeseries)}, but SCRAPE_DATE is ${datetime.getYYYYMD(
          scrapeDate
        )}`
          )
        }
        const counties = []
        for (const stateData of data) {
          if (stateData.Date === scrapeDateString) {
            const stateObj = { county: geography.addCounty(stateData.County) }
            if (stateData['Cases Total'] !== '') {
              stateObj.cases = parse.number(stateData['Cases Total'])
            }
            if (stateData['Tests Total'] !== '') {
              stateObj.tested = parse.number(stateData['Tests Total'])
            }
            if (stateData['Recovered Total'] !== '') {
              stateObj.recovered = parse.number(stateData['Recovered Total'])
            }
            if (stateData['Deaths Total'] !== '') {
              stateObj.deaths = parse.number(stateData['Deaths Total'])
            }
            if (stateData['Hospital Confirmed Total'] !== '') {
              stateObj.hospitalized = parse.number(stateData['Hospital Confirmed Total'])
            }
            if (stateData['ICU Total'] !== '') {
              stateObj.icu = parse.number(stateData['ICU Total'])
            }
            counties.push(stateObj)
          }
        }
        if (counties.length === 0) {
          throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${datetime.getYYYYMD(scrapeDate)}`)
        }
        counties.push(transform.sumData(counties))
        return counties
      }

    }
  ]
}

// TODO: fix 1999-09-09 start date
// TODO: fix 1999-09-09 scrape and crawl
