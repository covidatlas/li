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
const countryLevelMap = {
  "Hokkaidō Prefecture": "iso2:JP-01",
  "Aomori Prefecture": "iso2:JP-02",
  "Iwate Prefecture": "iso2:JP-03",
  "Miyagi Prefecture": "iso2:JP-04",
  "Akita Prefecture": "iso2:JP-05",
  "Yamagata Prefecture": "iso2:JP-06",
  "Fukushima Prefecture": "iso2:JP-07",
  "Ibaraki Prefecture": "iso2:JP-08",
  "Tochigi Prefecture": "iso2:JP-09",
  "Gunma Prefecture": "iso2:JP-10",
  "Saitama Prefecture": "iso2:JP-11",
  "Chiba Prefecture": "iso2:JP-12",
  "Tokyo": "iso2:JP-13",
  "Kanagawa Prefecture": "iso2:JP-14",
  "Niigata Prefecture": "iso2:JP-15",
  "Toyama Prefecture": "iso2:JP-16",
  "Ishikawa Prefecture": "iso2:JP-17",
  "Fukui Prefecture": "iso2:JP-18",
  "Yamanashi Prefecture": "iso2:JP-19",
  "Nagano Prefecture": "iso2:JP-20",
  "Gifu Prefecture": "iso2:JP-21",
  "Shizuoka Prefecture": "iso2:JP-22",
  "Aichi Prefecture": "iso2:JP-23",
  "Mie Prefecture": "iso2:JP-24",
  "Shiga Prefecture": "iso2:JP-25",
  "Kyoto Prefecture": "iso2:JP-26",
  "Osaka Prefecture": "iso2:JP-27",
  "Hyogo Prefecture": "iso2:JP-28",
  "Nara Prefecture": "iso2:JP-29",
  "Wakayama Prefecture": "iso2:JP-30",
  "Tottori Prefecture": "iso2:JP-31",
  "Shimane Prefecture": "iso2:JP-32",
  "Okayama Prefecture": "iso2:JP-33",
  "Hiroshima Prefecture": "iso2:JP-34",
  "Yamaguchi Prefecture": "iso2:JP-35",
  "Tokushima Prefecture": "iso2:JP-36",
  "Kagawa Prefecture": "iso2:JP-37",
  "Ehime Prefecture": "iso2:JP-38",
  "Kochi Prefecture": "iso2:JP-39",
  "Fukuoka Prefecture": "iso2:JP-40",
  "Saga Prefecture": "iso2:JP-41",
  "Nagasaki Prefecture": "iso2:JP-42",
  "Kumamoto Prefecture": "iso2:JP-43",
  "Oita Prefecture": "iso2:JP-44",
  "Miyazaki Prefecture": "iso2:JP-45",
  "Kagoshima Prefecture": "iso2:JP-46",
  "Okinawa Prefecture": "iso2:JP-47",
}

/**
 * @param {string} name - Name of the state.
 * @returns {string} - an iso2 ID.
 */
const getIso2FromName = (name) => {
  const iso2 = countryLevelMap[name] || countryLevelMap[name + " Prefecture"]
  assert(iso2, `no match for ${name}`)
  return iso2
}

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
      scrape ($, date) {
        assert($.features.length > 1, 'features are unreasonable')
        const attributes = $.features
          .map(({ attributes }) => attributes)
          .filter((item) => item.Date && datetime.dateIsBeforeOrEqualTo(new Date(item.Date), new Date(date)))

        assert(attributes.length > 1, 'data fetch failed, no attributes')

        const groupedByState = groupBy(attributes, attribute => attribute.Prefecture)

        const states = []
        for (const [ stateName, stateAttributes ] of Object.entries(groupedByState)) {
          states.push({
            state: getIso2FromName(stateName.replace('Hokkaido', 'Hokkaidō')),
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
