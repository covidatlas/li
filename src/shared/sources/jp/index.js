const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const datetime = require('../../datetime/index.js')

/**
 * Hand rolled version of _.groupBy
 *
 * @param {object[]} array
 * @param {(object) => string} func - Get the key to group by.
 * @returns {object} Where key is the result of the function, and the value is an array of the values that match.
 */
const groupBy = (array, func) => {
  return array.reduce((previousValue, currentValue) => {
    const currentKey = func(currentValue)
    const oldVersionOfCurrentKey = previousValue[currentKey] || []
    return { ...previousValue, [currentKey]: [ ...oldVersionOfCurrentKey, currentValue ] }
  }, {})
}

const country = 'iso1:JP'
module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'Ministry of Health, Labour, and Welfare Japan',
    url: 'https://mhlw-gis.maps.arcgis.com/apps/opsdashboard/index.html#/0c5d0502bbb54f9a8dddebca003631b8/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-01-14',
      crawl: [
        {
          type: 'json',
          url:
            'https://services8.arcgis.com/JdxivnCyd1rvJTrY/arcgis/rest/services/v2_covid19_list_csv/FeatureServer/0/query?where=0%3D0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson'
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        assert($.features.length > 1, 'features are unreasonable')
        const attributes = $.features
          .map(({ attributes }) => attributes)
          .filter((item) => item.Date && datetime.dateIsBeforeOrEqualTo(new Date(item.Date), new Date(date)))

        assert(attributes.length > 1, 'data fetch failed, no attributes')

        const groupedByState = groupBy(attributes, attribute => attribute.Prefecture)

        const states = []
        for (const [ stateName, stateAttributes ] of Object.entries(groupedByState)) {
          states.push({
            state: getIso2FromName({ country, name: stateName.replace('Hokkaido', 'Hokkaidō') }),
            cases: stateAttributes.length
          })
        }

        const statesCount = 46
        assert.equal(states.length, statesCount, 'Wrong number of states found')

        const summedData = transform.sumData(states)
        states.push(summedData)

        return states
      }
    }
  ]
}
