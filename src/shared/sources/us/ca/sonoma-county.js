const maintainers = require('../../_lib/maintainers.js')
const arcgis = require('../../_lib/arcgis.js')
const timeseriesFilter = require('../../_lib/timeseries-filter.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  county: 'fips:06097',

  maintainers: [ maintainers.camjc, maintainers.mnguyen ],

  timeseries: true,
  priority: 2,
  friendly: {
    name: 'Sonoma County Department of Emergency Management',
    url: 'https://socoemergency.org/emergency/novel-coronavirus/coronavirus-cases/'
  },

  scrapers: [
    {
      startDate: '2020-03-02',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated('https://services1.arcgis.com/P5Mv5GY5S66M8Z1Q/ArcGIS/rest/services/NCOV_Cases_Sonoma_County/FeatureServer/0/query'),
        },
      ],
      scrape (data, date) {
        const toYYYYMMDD = t => {
          const date = new Date(t)
          return date.toISOString().split('T')[0]
        }

        const { filterDate, func } = timeseriesFilter(data, 'Date', toYYYYMMDD, date)
        const filteredData = data.filter(func)
        const result = {
          cases: filteredData[0].Cumulative,
          active: filteredData[0].Active,
          deaths: filteredData[0].Deaths,
          recovered: filteredData[0].Recovered,
          date: filterDate,
        }

        if (result.cases === null && result.deaths === null) {
          throw new Error(`No data as at ${date}`)
        }

        return result
      }
    },
  ]

}
