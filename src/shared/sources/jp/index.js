const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const datetime = require('../../datetime/index.js')
const arcgis = require('../_lib/arcgis.js')

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
          paginated: async client => {
            const url = 'https://services8.arcgis.com/JdxivnCyd1rvJTrY/arcgis/rest/services/v2_covid19_list_csv/FeatureServer/0/query'
            return arcgis.crawlPaginated(client, url)
          }
        }
      ],
      scrape (pages, date, { getIso2FromName, groupBy }) {
        let attributes = arcgis.loadPaginatedFeatures(pages).
            map(f => f.attributes).
            filter(i => i.Date).
            filter(i => datetime.dateIsBeforeOrEqualTo(new Date(i.Date), date))
        assert(attributes.length > 0, 'data fetch failed, no attributes')

        const groupedByState = groupBy(attributes, attribute => attribute.Prefecture)
        const states = []
        for (const [ stateName, stateAttributes ] of Object.entries(groupedByState)) {
          states.push({
            state: getIso2FromName({ country, name: stateName }),
            cases: stateAttributes.length
          })
        }

        const summedData = transform.sumData(states)
        states.push(summedData)

        // console.table(states)
        return states
      }
    }
  ]
}
