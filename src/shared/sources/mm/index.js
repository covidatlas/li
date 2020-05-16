const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:MM'

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'Myanmar Ministry of Health and Sports',
    url: 'https://doph.maps.arcgis.com/apps/opsdashboard/index.html#/f8fb4ccc3d2d42c7ab0590dbb3fc26b8'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-05-05',
      crawl: [
        {
          type: 'json',
          url:
            'https://services7.arcgis.com/AB2LoFxJT2bJUJYC/arcgis/rest/services/CaseCount_With_Cases_150420/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc&resultOffset=0&resultRecordCount=1000&resultType=standard&cacheHint=true'
        }
      ],
      scrape ($, date, { cumulateObjects,  getIso2FromName, groupBy }) {
        assert($.features.length > 0, 'features are unreasonable')
        const attributes = $.features.map(({ attributes }) => attributes)

        assert(attributes.length > 0, 'data fetch failed, no attributes')

        const getIso2FromNameForMM = (nameRaw) => {
          const parentheticalRegex = / \(\w+\)/
          const name = nameRaw.replace(parentheticalRegex, '').replace(' State', '').replace(' Region', '')
          if (name === 'Chin') {
            return 'iso2:MM-14'
          }
          if (name === 'Mangway') {
            return 'iso2:MM-03'
          }
          return getIso2FromName({ country, name })
        }
        const groupedByState = groupBy(attributes, attribute => getIso2FromNameForMM(attribute.SR))
        const states = []

        for (const [ stateName, stateAttributes ] of Object.entries(groupedByState)) {
          const cumulatedObject = cumulateObjects(stateAttributes)
          states.push({
            state: stateName,
            cases: cumulatedObject.Confirmed + (cumulatedObject.PUI || 0),
            deaths: cumulatedObject.Death,
            recovered: cumulatedObject.Recovered,
            tested: cumulatedObject.Tested,
          })
        }

        const summedData = transform.sumData(states)
        states.push(summedData)
        assert(summedData.cases > 0, 'Cases are not reasonable')
        return states
      }
    }
  ]
}
