const maintainers = require('../../_lib/maintainers.js')
const arcgis = require('../../_lib/arcgis.js')
const timeseriesFilter = require('../../_lib/timeseries-filter.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  county: 'fips:06095',

  maintainers: [ maintainers.mnguyen ],

  timeseries: true,
  priority: 2,
  friendly: {
    name: 'Solano County Public Health',
    url: 'https://doitgis.maps.arcgis.com/apps/MapSeries/index.html?appid=055f81e9fe154da5860257e3f2489d67'
  },

  scrapers: [
    {
      startDate: '2020-02-13',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated('https://services2.arcgis.com/SCn6czzcqKAFwdGU/ArcGIS/rest/services/COVID19Surveypt1v3_view/FeatureServer/0/query'),
        },
      ],
      scrape (data, date) {
        const toYYYYMMDD = t => {
          const date = new Date(t)
          // Convert from UTC to PDT
          date.setUTCHours(-7)
          return date.toISOString().split('T')[0]
        }

        const { filterDate, func } = timeseriesFilter(data, 'Date_reported', toYYYYMMDD, date)
        var result = {
          date: filterDate,
        }
        const filteredData = data.filter(func)

        // Each of these fields has been null by itself at some point or another in the table.
        if (filteredData[0].cumulative_cases !== null) {
          result.cases = filteredData[0].cumulative_cases
        }
        if (filteredData[0].Active_cases !== null) {
          result.active = filteredData[0].Active_cases
        }
        if (filteredData[0].currently_hospitalized_cases !== null) {
          result.hospitalized_current = filteredData[0].currently_hospitalized_cases
        }
        if (filteredData[0].total_hospitalizations !== null) {
          result.hospitalized = filteredData[0].total_hospitalizations
        }
        if (filteredData[0].total_deaths !== null) {
          result.deaths = filteredData[0].total_deaths
        }
        if ("cases" in result && "active" in result && "deaths" in result) {
          result.recovered = result.cases - result.active - result.deaths
        }

        return result
      }
    },
  ]

}
