const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const datetime = require('../../datetime/index.js')

const country = 'iso1:HK'

module.exports = {
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'The Government of Hong Kong',
    url: 'https://www.coronavirus.gov.hk/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-01-23',
      crawl: [
        {
          type: 'json',
          url: 'https://services8.arcgis.com/PXQv9PaDJHzt8rp0/ArcGIS/rest/services/HKConfirmedCases_0208_Chart/FeatureServer/0/query?where=0%3D0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson'
        },
      ],
      scrape ($, date) {
        assert($.features.length > 0, 'features are unreasonable')
        const attributes = $.features
          .map(({ attributes }) => attributes)
          .filter((item) => {
            const itemIsoDate = item.Date_of_laboratory_confirmation.replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$2-$1')
            return datetime.dateIsBeforeOrEqualTo(datetime.parse(itemIsoDate), date)
          })

        assert(attributes.length > 0, `data fetch failed, no attributes for date ${date}`)

        return { case: attributes.length }
      }
    }
  ]
}
