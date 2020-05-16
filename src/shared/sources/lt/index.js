// const { UNASSIGNED } = require('../_lib/constants.js')
const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const mapping = require('./mapping.json')
const transform = require('../_lib/transform.js')

module.exports = {
  aggregate: 'state',
  country: 'iso1:LT',
  priority: 1,
  friendly: {
    url: 'http://sam.lrv.lt/lt/news/koronavirusas',
    name: 'Ministry of Health of the Republic of Lithuania'
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-04-16',
      crawl: [
        {
          type: 'json',
          url: 'https://services.arcgis.com/XdDVrnFqA9CT3JgB/arcgis/rest/services/covid_locations/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=false'
        },
      ],
      scrape ($) {
        const attributes = $.features.map(({ attributes }) => attributes)
        assert(attributes.length > 0, 'data fetch failed, no attributes')

        const casesByRegion = {}

        for (const item of attributes) {

          // NOTE: Current mapping is all levels to ISO2 for state level.
          // Possibly all levels should go to their corresponding ISO2s instead.
          const iso2 = mapping[item.Miestas]

          const stateData = casesByRegion[iso2] || [] // Data accumulates per-state.

          stateData.push({
            city: item.Miestas, // TODO: Should this be mapped to iso2 as well?
            state: iso2,
            cases: Number.isInteger(item.Atvejai) ? item.Atvejai : undefined,
            deaths: Number.isInteger(item.Mirė) ? item.Mirė : undefined,
            recovered: Number.isInteger(item.Pasveiko) ? item.Pasveiko : undefined
          })
          casesByRegion[iso2] = stateData
        }

        const states = []

        for (const region of Object.keys(casesByRegion)) {
          states.push(transform.sumData(casesByRegion[region], { state: region }))
        }

        const summedData = transform.sumData(states)
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable')
        return states
      }
    }
  ]
}
