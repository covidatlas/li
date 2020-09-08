const maintainers = require('../../_lib/maintainers.js')
const arcgis = require('../../_lib/arcgis.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  county: 'fips:06001',

  maintainers: [ maintainers.mnguyen ],

  timeseries: true,
  priority: 2,
  friendly: {
    name: 'Alameda County Data Sharing Initiative',
    url: 'https://data.acgov.org/datasets/AC-HCSA::alameda-county-covid-19-data-by-date'
  },

  scrapers: [
    {
      startDate: '2020-01-19',
      crawl: [
        {
          type: 'json',
          name: 'base',
          paginated: arcgis.paginated('https://services5.arcgis.com/ROBnTHSNjoZ2Wm1P/arcgis/rest/services/COVID_19_Statistics/FeatureServer/4/query'),
        },
      ],
      scrape (base, date) {
        var result = {}
        const timestampToISO = t => new Date(t).toISOString().split('T')[0]

        const datedBase = base.filter(f => date === timestampToISO(f.dtcreate))
        if (datedBase.length !== 0) {
          result.cases = parseInt(datedBase[0].Alameda_County__Cumulative, 10)
          result.deaths = parseInt(datedBase[0].Alameda_County_Deaths__Cumulati, 10)
        }

        if (Object.keys(result).length === 0) {
          throw new Error(`No data as at ${date}`)
        }

        return result
      }
    },
  ]

}
