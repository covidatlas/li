const maintainers = require('../../_lib/maintainers.js')
const arcgis = require('../../_lib/arcgis.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  county: 'fips:06001',

  maintainers: [ maintainers.mnguyen ],

  timeseries: true,
  priority: 1,
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
          paginated: arcgis.paginated('https://services3.arcgis.com/1iDJcsklY3l3KIjE/arcgis/rest/services/AC_dates2/FeatureServer/0/query'),
        },
        {
          type: 'json',
          name: 'hospitalizations',
          paginated: arcgis.paginated('https://services3.arcgis.com/1iDJcsklY3l3KIjE/arcgis/rest/services/AC_hospitalized2/FeatureServer/0/query'),
        },
        {
          type: 'json',
          name: 'tests',
          paginated: arcgis.paginated('https://services3.arcgis.com/1iDJcsklY3l3KIjE/arcgis/rest/services/AC_testing_dates2/FeatureServer/0/query'),
        },
      ],
      scrape ({ base, hospitalizations, tests }, date) {
        var result = {}
        const timestampToISO = t => new Date(t).toISOString().split('T')[0]

        const datedBase = base.filter(f => date === timestampToISO(f.Date))
        if (datedBase.length !== 0) {
          result.cases = datedBase[0].AC_CumulCases
          result.deaths = datedBase[0].AC_CumulDeaths
        }

        const datedHospitalizations = hospitalizations.filter(f => date === timestampToISO(f.Date))
        if (datedHospitalizations.length !== 0) {
          result.hospitalized_current = datedHospitalizations[0].Hospitalized_COVID_19_Positive_
          result.icu_current = datedHospitalizations[0].ICU_COVID_19_Positive_Patients
        }

        const datedTests = tests.filter(f => date === timestampToISO(f.Date))
        if (datedTests.length !== 0) {
          result.tested = datedTests[0].AC_Tests
        }

        if (Object.keys(result).length === 0) {
          throw new Error(`No data as at ${date}`)
        }

        return result
      }
    },
  ]

}
