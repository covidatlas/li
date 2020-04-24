const maintainers = require('../../_lib/maintainers.js')
const geography = require('../../_lib/geography/index.js')
const transform = require('../../_lib/transform.js')
const constants = require('../../_lib/constants.js')

const allCounties = [
  'Orleans County',
  'Grand Isle County',
  'Chittenden County',
  'Windsor County',
  'Windham County',
  'Bennington County',
  'Franklin County',
  'Essex County',
  'Lamoille County',
  'Caledonia County',
  'Orange County',
  'Washington County',
  'Rutland County',
  'Addison County'
]

module.exports = {
  state: 'iso2:US-VT',
  country: 'iso1:US',
  friendly: {
    url: 'https://www.healthvermont.gov/response/coronavirus-covid-19',
    name: 'Vermont Department of Health'
  },
  aggregate: 'county',
  maintainers: [ maintainers.aed3 ],
  scrapers: [
    {
      startDate: '2020-04-11',
      crawl: [
        {
          name: 'data',
          url:
      'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/VT_Counties_Cases/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*',
          type: 'json',
        },
        {
          name: 'totals',
          url:
      'https://services1.arcgis.com/BkFxaEFNwHqX3tAw/arcgis/rest/services/county_summary/FeatureServer/0/query?where=1%3D1&outFields=*&f=pjson',
          type: 'json',
        }
      ],
      scrape ({ data, totals }) {
        console.log(arguments)
        const regions = []

        data.features.forEach(item => {
          const cases = item.attributes.Cases
          const deaths = item.attributes.Deaths
          let county = geography.addCounty(item.attributes.Label)

          if (county.includes('Pending Validation')) {
            county = constants.UNASSIGNED

            // TODO remove this when #28 is fixed
            return
          }

          regions.push({
            county,
            cases,
            deaths
          })
        })

        const state = transform.sumData(regions)
        state.tested = totals.features.pop().attributes.total_tests
        regions.push(state)

        return geography.addEmptyRegions(regions, allCounties, 'county')
      }
    }
  ]
}
