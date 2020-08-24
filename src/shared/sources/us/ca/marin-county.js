const maintainers = require('../../_lib/maintainers.js')
const arcgis = require('../../_lib/arcgis.js')
const timeseriesFilter = require('../../_lib/timeseries-filter.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  county: 'fips:06041',

  maintainers: [ maintainers.mnguyen ],

  timeseries: true,
  priority: 2,
  friendly: {
    name: 'Marin Health & Human Services',
    url: 'https://coronavirus.marinhhs.org/surveillance'
  },

  scrapers: [
    {
      startDate: '2020-01-19',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated('https://services6.arcgis.com/T8eS7sop5hLmgRRH/ArcGIS/rest/services/Covid19_Cumulative/FeatureServer/0/query'),
        },
      ],
      scrape (data, date) {
        // It appears that they return 'null' when they don't have
        // data yet (the above arcgis query returns 'null' for the
        // last date, but they do have the previous date), so skip
        // 'null' records.
        const fields = [ 'Total_Cases', 'Total_Recovered_', 'Total_Hospitalized', 'Total_Deaths' ]
        const useData = data.filter(d => fields.map(f => d[f]).some(v => v !== null))
        const toYYYYMMDD = t => new Date(t).toISOString().split('T')[0]
        const { filterDate, func } = timeseriesFilter(useData, 'Date', toYYYYMMDD, date)
        const rec = useData.filter(func)[0]
        return {
          cases: rec.Total_Cases,
          recovered: rec.Total_Recovered_,
          hospitalized: parseInt(rec.Total_Hospitalized, 10),
          deaths: parseInt(rec.Total_Deaths, 10),
          date: filterDate,
        }
      }
    },
  ]

}
