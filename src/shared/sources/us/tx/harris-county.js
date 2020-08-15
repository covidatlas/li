const srcShared = '../../../'
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')


module.exports = {
  county: 'fips:48201',
  state: 'iso2:US-TX',
  country: 'iso1:US',

  maintainers: [ maintainers.jzohrab ],
  timeseries: true,
  friendly:   {
    url: 'https://publichealth.harriscountytx.gov/Resources/2019-Novel-Coronavirus',
    name: '2019 Novel Coronavirus',
  },
  scrapers: [
    {
      startDate: '2020-03-22',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated(
            'https://services.arcgis.com/su8ic9KbA7PYVxPS/ArcGIS/rest/services/InvestigationForPublicDashboard_DASHUpdate/FeatureServer/1/query'
          )
        },
      ],
      scrape (data, date) {

        // The data contains two values in record.Source: HCTX and
        // HOU.  When summed, they give the same values shown on the
        // public dashboard.

        // The data uses integers for the date, eg 1597384800000 =
        // 2020-03-22T06:00:00.000Z.
        const toYYYYMMDD = n => new Date(n).toISOString().split('T')[0]

        const { filterDate, func } = timeseriesFilter(data, 'Date', toYYYYMMDD, date)

        const propMap = {
          Total: 'cases',
          Recovered: 'recovered',
          Deceased: 'deaths',
          Active: 'active'
        }

        const rowToCaseRecord = row => {
          return Object.entries(propMap).reduce((hsh, pair) => {
            const [ f, prop ] = pair
            hsh[prop] = row[f]
            return hsh
          }, {})
        }

        const result = data.filter(func).
              map(rowToCaseRecord).
              reduce((totals, rec) => {
                const props = Object.values(propMap)  // cases, etc.
                props.forEach(p => totals[p] += rec[p])
                return totals
              })

        if (result.length === 0) {
          throw new Error(`No data for filter date ${filterDate}`)
        }

        result.date = filterDate
        return result
      }
    }
  ]
}
