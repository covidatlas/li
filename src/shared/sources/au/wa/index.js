const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')
const datetime = require('../../../datetime/index.js')

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-WA',
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'Ministry of Health, Labour, and Welfare Japan',
    url: 'https://experience.arcgis.com/experience/359bca83a1264e3fb8d3b6f0a028d768'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-21',
      crawl: [
        {
          type: 'json',
          url:
            'https://services.arcgis.com/Qxcws3oU4ypcnx4H/ArcGIS/rest/services/simple_dashboard_report_view_layer/FeatureServer/3/query?where=0%3D0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson'
        }
      ],
      scrape ($, date) {
        assert($.features.length > 1, 'features are unreasonable')
        const item = $.features
          .map(({ attributes }) => attributes)
          .find(({ date: attributeDate }) =>
            datetime.getYYYYMMDD(datetime.parse(attributeDate)) === datetime.getYYYYMMDD(datetime.parse(date))
          )

        assert(item, 'item for today not found')
        console.table(item)

        const data = {
          cases: item.Confirmed,
          recovered: item.Recovered,
          deaths: item.Death,
          testedNegative: item.Tested_nagative, // Ha ha, "nagative".
          hospitalized: item.Hospitalised,
        }

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
