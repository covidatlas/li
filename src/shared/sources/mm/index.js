const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')

/**
 * Sum/add-up per key.
 * @param {Object[]} items - Things to sum per key
 * @returns {Object} - Keys are all the number fields on the object.
 */
const cumulateObject = items =>
  items.reduce((previous, item) => {
    const newObject = { ...previous }
    for (const [ key, value ] of Object.entries(item)) {
      if (typeof value !== 'number') {
        continue
      }
      if (!newObject[key]) {
        newObject[key] = value
        continue
      }
      newObject[key] += value
    }
    return newObject
  }, {})

const country = 'iso1:MM'

module.exports = {
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
      scrape ($, date, { getIso2FromName, groupBy }) {
        assert($.features.length > 1, 'features are unreasonable')
        const attributes = $.features.map(({ attributes }) => attributes)

        assert(attributes.length > 1, 'data fetch failed, no attributes')

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
          const cumulatedObject = cumulateObject(stateAttributes)
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
        assert(states.cases > 0, 'Cases are not reasonable')
        return states
      }
    }
  ]
}
