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
        const toYYYYMMDD = t => new Date(t).toISOString().split('T')[0]
        const { filterDate, func } = timeseriesFilter(data, 'Date', toYYYYMMDD, date)
        const filteredData = data.filter(func)
        return {
          cases: filteredData[0].Total_Cases,
          recovered: filteredData[0].Total_Recovered_,
          hospitalized: parseInt(filteredData[0].Total_Hospitalized, 10),
          deaths: parseInt(filteredData[0].Total_Deaths, 10),
          date: filterDate,
        }
      }
    },
  ]

}
