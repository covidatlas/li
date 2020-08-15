// Migrated from coronadatascraper, src/shared/scrapers/CA/NS/index.js

const srcShared = '../../../'
const assert = require('assert')
const datetime = require(srcShared + 'datetime/index.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  state: 'iso2:CA-NS',
  country: 'iso1:CA',
  timeseries: true,
  certValidation: false,
  friendly:   {
    name: 'Government of Nova Scotia',
    url: 'https://novascotia.ca/coronavirus/#cases',
  },
  maintainers: [ maintainers.lazd, maintainers.jzohrab ],
  scrapers: [
    {
      startDate: '2020-03-03',
      crawl: [
        {
          type: 'csv',
          url: 'https://novascotia.ca/coronavirus/COVID-19-cases.csv',
        },
      ],
      scrape (data, date) {

        const headers = Object.keys(data[0])
        if (headers[0] !== 'Date' || headers[1] !== 'Positive' || headers[2] !== 'Negative') {
          throw new Error('Unknown headers in CSV')
        }

        // FIXME when we roll out new TZ support!
        let scrapeDate = date
        let scrapeDateString = datetime.getYYYYMD(scrapeDate)
        const lastDateInTimeseries = new Date(`${data[data.length - 1].Date} 12:00:00`)
        const firstDateInTimeseries = new Date(`${data[0].Date} 12:00:00`)
        if (scrapeDate > lastDateInTimeseries) {
          console.error(
            `  🚨 timeseries for ${geography.getName(
            this
          )}: scrape date ${scrapeDateString} is newer than last sample time ${datetime.getYYYYMD(
            lastDateInTimeseries
          )}. Using last sample anyway`
          )
          scrapeDate = lastDateInTimeseries
          scrapeDateString = datetime.getYYYYMD(scrapeDate)
        }
        if (scrapeDate < firstDateInTimeseries) {
          throw new Error(`Timeseries starts later than scrape date ${scrapeDateString}`)
        }
        for (const row of data) {
          if (datetime.getYYYYMD(`${row.Date} 12:00:00`) === scrapeDateString) {
            const pos = parse.number(row.Positive)
            const neg = parse.number(row.Negative)
            return {
              cases: pos,
              tested: pos + neg
            }
          }
        }
        const msg = `Timeseries does not contain a sample for scrape date ${scrapeDateString}`
        throw new Error(msg)

      }
    },

    {
      startDate: '2020-04-12',
      crawl: [
        {
          type: 'csv',
          url: 'https://novascotia.ca/coronavirus/data/ns-covid19-data.csv',
          // The filename is COVID-19-data.csv, but it's not actually
          // valid CSV.  The first line appears to be obsolete
          // headings, and the actual CSV starts on line 2.
          options: { columns: true, from_line: 2 }
        },
      ],
      scrape (data, date) {

        const expectedHeadings = [ 'New', 'Tests', 'Resolved', 'non-ICU', 'ICU', 'Deaths' ]
        const missingExpected = expectedHeadings.filter(h => {
          return !Object.keys(data[0]).includes(h)
        })
        assert.equal(missingExpected.length, 0, `Missing headings ${missingExpected.join()}`)

        // ca-ns reports dates as yyyymmdd already (eg 2020-03-15)
        const toYYYYMMDD = s => s

        let { func } = timeseriesFilter(data, 'Date', toYYYYMMDD, date, '<=')

        const numeric = expectedHeadings
        const dataToDate = data.filter(func).
              sort((a, b) => a.Date < b.Date ? -1 : 1).
              map(d => {
                return numeric.reduce((hsh, f) => {
                  hsh[f] = parseInt(d[f], 10)
                  return hsh
                }, { Date: d.Date })
              })

        // The numbers in the data match the totals shown on
        // https://novascotia.ca/coronavirus/data/, but they are
        // handled differently.  In this data:
        // - Cases = _new_ cases for date
        // - Deaths = _new_ deaths for date
        // - Negative = total negative to date
        // - Recovered = recovered to date
        // - non-ICU + ICU = current hospitalized
        const raw = dataToDate.reduce((total, rec) => {
          // Cumulative
          total.Cases = total.Cases || total.New
          total.Cases += rec.New
          total.Deaths += rec.Deaths; // ; is required for some reason!

          // As-is
          [ 'Date', 'Tests', 'Resolved', 'non-ICU', 'ICU' ].forEach(f => {
            total[f] = rec[f]
          })
          total.Active = total.Cases - total.Resolved

          return total
        })

        if (raw.length === 0)
          throw new Error(`No data for ${date}`)

        return {
          date: raw.Date,
          recovered: raw.Resolved,
          icu_current: raw.ICU,
          hospitalized_current: raw['non-ICU'],
          tested: raw.Tests + raw.Cases,
          cases: raw.Cases,
          deaths: raw.Deaths
        }
     }
    }
  ]
}
