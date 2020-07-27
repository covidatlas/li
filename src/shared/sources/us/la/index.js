// Contributed to CDS by Spencer Lyon in
// https://github.com/covidatlas/coronadatascraper/pull/1032

const srcShared = '../../../'
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')


module.exports = {

  state: 'iso2:US-LA',
  country: 'iso1:US',
  aggregate: 'state',
  maintainers: [ maintainers.sglyon, maintainers.jzohrab ],
  timeseries: true,
  friendly:   {
    url: 'https://ready.nola.gov/incident/coronavirus/safe-reopening/',
    name: 'City of New Orleans Office of Homeland Security and Emergency Preparedness',
  },
  scrapers: [
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'json',
          url: 'https://gis.nola.gov/arcgis/rest/services/apps/LDH_Data/MapServer/0/query?f=json&where=Date%3Etimestamp%20%272020-03-18%2003%3A59%3A59%27&returnGeometry=falses&outFields=*&orderByFields=Date%20asc&resultOffset=0&resultRecordCount=1000',
        },
      ],
      scrape (data, date) {

        // They report dates as epoch ms, eg 1584532800000 = 2020-03-18.
        function toYYYYMMDD (n) {
          const d = new Date(n)
          return d.toISOString().split('T')[0]
        }

        const items = data.features.map(f => f.attributes)
        const { filterDate, func } = timeseriesFilter(items, 'Date', toYYYYMMDD, date)

        const rows = items.filter(func)
        if (rows.length === 0) {
          throw new Error(`No data for filter date ${filterDate}`)
        }
        if (rows.length > 1) {
          throw new Error(`${rows.length} rows returned for ${filterDate}`)
        }

        const result = []
        const row = rows[0]

        // Orleans county
        result.push({
          county: 'fips:22071',
          cases: row.NO_Cases,
          deaths: row.NO_Deaths,
          tested: row.NO_Total_Tests,
          date: filterDate,
          icu_current: row.R1_ICU_Beds_In_Use,
          hospitalized_current: row.R1_Beds_In_Use
        })

        // State
        result.push({
          cases: row.LA_Cases,
          deaths: row.LA_Deaths,
          tested: row.LA_Total_Tests,
          date: filterDate
        })

        return result
      }
    }
  ]
}
