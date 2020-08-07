const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const arcgis = require('../_lib/arcgis.js')
const timeseriesFilter = require('../_lib/timeseries-filter.js')

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
          paginated: arcgis.paginated('https://services8.arcgis.com/JdxivnCyd1rvJTrY/arcgis/rest/services/v2_covid19_list_csv/FeatureServer/0/query')
        }
      ],
      scrape (data, date, { getIso2FromName, groupBy }) {
        // JP reports data as epoch int
        // e.g. 1578960000000 = 2020-01-14T00:00:00.000Z
        // If null, assume it's 2020-01-14
        function toYYYYMMDD (n) {
          if (!n)
            return '2020-01-14'
          return new Date(n).toISOString().split('T')[0]
        }

        const { filterDate, func } = timeseriesFilter(data, 'Date', toYYYYMMDD, date)
        const items = data.filter(func)

        const groupedByState = groupBy(items, attribute => attribute.Prefecture)
        const states = []
        for (const [ stateName, stateItems ] of Object.entries(groupedByState)) {
          states.push({
            state: getIso2FromName({ country, name: stateName }),
            cases: stateItems.length,
            date: filterDate
          })
        }

        const summedData = transform.sumData(states)
        states.push({ ...summedData, date: filterDate })

        return states
      }
    }
  ]
}
