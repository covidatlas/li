// Migrated from coronadatascraper, src/shared/scrapers/US/NV/washoe-county/index.js

const srcShared = '../../../'
const datetime = require(srcShared + 'datetime/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')

module.exports = {
  county: 'fips:32031',
  state: 'iso2:US-NV',
  country: 'iso1:US',
  certValidation: false,
  timeseries: true,
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    name: 'Washoe County Health District',
    url: 'https://www.washoecounty.us/health/',
    description: 'Washoe County, Nevada health department',
  },
  scrapers: [
    {
      startDate: '2020-03-06',
      crawl: [
        {
          type: 'json',
          url: 'https://services.arcgis.com/iCGWaR7ZHc5saRIl/arcgis/rest/services/CasesTable_public/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&orderByFields=reportdt%20asc',
        },
      ],
      scrape (data, date) {

        const countyDates = []
        for (const row of data.features) {
          const parseNum = s => {
            return typeof(s) === 'number' ? s : undefined
          }
          const a = row.attributes
          const countyDate = {
            cases: parseNum(a.confirmed),
            active: parseNum(a.active),
            recovered: parseNum(a.recovered),
            deaths: parseNum(a.deaths),
            // tested: parseNum(a.tested),
            hospitalized_current: parseNum(a.Hospitalized),
            icu_current: parseNum(a.Intubated),
            discharged: parseNum(a.ReleasedFromHospital),
            date: datetime.getYYYYMMDD(datetime.parse(a.MDYYYY).toString())
          }
          countyDates[countyDate.date] = countyDate
        }

        const dateKeys = Object.keys(countyDates).sort()
        const firstDate = dateKeys.shift()
        const lastDate = dateKeys.pop()
        let scrapeDate = datetime.getYYYYMMDD(date)
        if (scrapeDate < firstDate) {
          throw new Error(`${scrapeDate} < first date in data, ${firstDate}`)
        }
        if (scrapeDate > lastDate) {
          console.error(`${scrapeDate} > last date in data, ${lastDate}, using last date`)
          scrapeDate = lastDate
        }

        return countyDates[ scrapeDate ]
      }
    }
  ]
}
