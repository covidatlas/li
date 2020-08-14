// Contributed to CDS by Spencer Lyon in
// https://github.com/covidatlas/coronadatascraper/pull/1032

const srcShared = '../../../'
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')


module.exports = {

  state: 'iso2:US-LA',
  country: 'iso1:US',
  aggregate: 'state',
  priority: 1,
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
          paginated: arcgis.paginated(
            'https://gis.nola.gov/arcgis/rest/services/apps/LDH_Data/MapServer/0/query',
            {
              outFields: 'Date,NO_Cases,NO_Deaths,NO_Total_Tests,R1_ICU_Beds_In_Use,' +
                'R1_Beds_In_Use,LA_Cases,LA_Deaths,LA_Total_Tests,LA_COVID_Hospitalizations'
            }
          )
        },
      ],
      scrape (data, date) {

        // They report dates as epoch ms, eg 1584532800000 = 2020-03-18.
        function toYYYYMMDD (n) {
          const d = new Date(n)
          return d.toISOString().split('T')[0]
        }

        const { filterDate, func } = timeseriesFilter(data, 'Date', toYYYYMMDD, date)

        const rows = data.filter(func)

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
          // I don't feel we can rely on this data, as it doesn't
          // specify if these are covid hospitalizations/icu.  The
          // NO.hospitalized_current > LA.hospitalized_current if we
          // use this data, which doesn't make sense.  jz
          // icu_current: row.R1_ICU_Beds_In_Use,
          // hospitalized_current: row.R1_Beds_In_Use,
          date: filterDate
        })

        // State
        result.push({
          cases: row.LA_Cases,
          deaths: row.LA_Deaths,
          tested: row.LA_Total_Tests,
          hospitalized_current: row.LA_COVID_Hospitalizations,
          date: filterDate
        })

        return result
      }
    }
  ]
}
