const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:NG'

const nameToCanonical = { // Name differences get mapped to the canonical names
  'FCT': 'Federal Capital Territory',
  'Nassarawa': 'Nasarawa',
}

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  friendly: {
    name: 'Nigeria Center for Disease Control',
    url: 'https://covid19.ncdc.gov.ng/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-05-13',
      crawl: [
        {
          type: 'json',
          url:
            'https://services5.arcgis.com/Y2O5QPjedp8vHACU/arcgis/rest/services/NgeriaCovid19/FeatureServer/0//query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token='
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        assert($.features.length > 0, 'features are unreasonable')
        const attributes = $.features
          .map(({ attributes }) => attributes)

        assert(attributes.length > 0, 'data fetch failed, no attributes')

        const states = []
        attributes.forEach((attribute) => {
          states.push({
            state: getIso2FromName({ country, name: attribute.NAME_1, nameToCanonical }),
            active: attribute.Active_Cases,
            cases: attribute.ConfCases,
            deaths: attribute.Deaths,
            recovered: attribute.Recovery
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
