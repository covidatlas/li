const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:LV'

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'Latvia Management of the Center for Disease Prevention and Control',
    url: 'https://arkartassituacija.gov.lv/',
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-04-14',
      crawl: [
        {
          type: 'json',
          url:
            'https://services7.arcgis.com/g8j6ESLxQjUogx9p/arcgis/rest/services/Latvia_covid_novadi/FeatureServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=false'
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        const getIso2LV = (name) => {
          const isoOverrides = { // Non-unique gets mapped straight to ISO2
            'Ventspils': 'iso2:LV-VEN',
            'Jelgava': 'iso2:LV-JEL',
            'Rēzekne': 'iso2:LV-REZ',
            'Jēkabpils': 'iso2:LV-JKB',
            'Jelgavas novads': 'iso2:LV-041',
            'Daugavpils': 'iso2:LV-DGV',
          }

          const nameOverrides = { // Name differences get mapped to the canonical names
            "Cēsu novads": "Cēsis county",
            "Mazsalacas novads": "Mazsalaca county",
          }

          return isoOverrides[name] || getIso2FromName({ country, name: nameOverrides[name] || name })
        }
        assert($.features.length > 0, 'features are unreasonable')
        const attributes = $.features.map(({ attributes }) => attributes)

        assert(attributes.length > 0, 'data fetch failed, no attributes')

        const states = []
        attributes.forEach((attribute) => {
          states.push({
            state: getIso2LV(attribute.Nos_pilns),
            cases: attribute.Covid_sasl,
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable')
        return states
      }
    }
  ]
}
