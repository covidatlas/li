// Migrated from coronadatascraper, src/shared/scrapers/US/NY/index.js

const srcShared = '../../'
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const dataTransform = require('./_data-transform.js')

module.exports = {
  country: 'iso1:MX',
  aggregate: 'state',
  maintainers: [ maintainers.jzohrab ],
  timeseries: true,
  friendly:   {
    url: 'https://coronavirus.gob.mx/datos/#DownZCSV',
    name: 'Coronavirus Data Downloads',
  },
  scrapers: [
    {
      startDate: '2020-01-12',
      crawl: [
        {
          type: 'csv',
          url: () => {
            // MX usually has data dated as at yesterday.
            const d = new Date()
            d.setDate(d.getDate() - 1)
            const yyyymmdd = d.toISOString().split('T')[0].replace(/-/g, '')
            const url = `https://coronavirus.gob.mx/datos/Downloads/Files/Casos_Diarios_Estado_Nacional_Confirmados_${yyyymmdd}.csv`
            return { url }
          }
        }
      ],
      scrape (rawdata, date) {
        const data = dataTransform.transform(rawdata)
        const states = [ ...new Set(data.map(d => d.name)) ].
              filter(s => s.toUpperCase() !== 'NACIONAL').
              sort()

        // dataTransform.transform returns dates as YYYYMMDD already.
        const toYYYYMMDD = s => s

        const { filterDate, func } = timeseriesFilter(data, 'date', toYYYYMMDD, date, '<=')

        const dailies = data.filter(func)

        const result = states.map(s => {
          const cases = dailies.filter(d => d.name === s).
                reduce((sum, row) => sum += row.value, 0)
          return {
            state: dataTransform.iso2Lookup(s),
            cases,
            date: filterDate    // Explicitly set the date.
          }
        })

        if (result.length === 0) {
          throw new Error(`No data for filter date ${filterDate}`)
        }

        result.push({ ...transform.sumData(result), date: filterDate })
        return result
      }
    }
  ]
}
