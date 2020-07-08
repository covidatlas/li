const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const timeseriesFilter = require('../_lib/timeseries-filter.js')

const country = 'iso1:SE'

const casesKey = 'Kumulativa_fall'
const deathsKey = 'Kumulativa_avlidna'
const icuKey = 'Kumulativa_intensivvardade'

const datetimeKey = 'Statistikdatum'
const nonStateKeys = [
  'OBJECTID',
  datetimeKey,
  'Totalt_antal_fall',
  casesKey,
  'Antal_avlidna',
  deathsKey,
  'Antal_intensivvardade',
  icuKey,
]

const isoMap = { // Non-unique gets mapped straight to ISO2
  'Gotland': 'iso2:SE-I',
}

const nameToCanonical = { // Name differences get mapped to the canonical names
  'Dalarna': 'Dalecarlia',
}

module.exports = {
  aggregate: 'state',
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'Public Health Agency of Sweden',
    url: 'https://folkhalsomyndigheten.se',
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-04',
      crawl: [
        {
          type: 'json',
          url:
            'https://services5.arcgis.com/fsYDFeRKu1hELJJs/arcgis/rest/services/FOHM_Covid_19_FME_1/FeatureServer/1//query?where=1%3D1&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token='
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, cumulateObjects }) {
        assert($.features.length > 0, 'data is unreasonable')

        // SE reports data as epoch ms (e.g., 1593561600000 for 2020-07-01T00:00:00.000Z)
        function toYYYYMMDD (n) {
          return new Date(n).toISOString().split('T')[0]
        }

        const attributes = $.features
              .map(({ attributes }) => attributes)
              .filter((item) => toYYYYMMDD(item[datetimeKey]) <= date)
        assert(attributes.length > 0, `data fetch failed, no attributes before or at date: ${date}`)

        const { filterDate, func } = timeseriesFilter(attributes, datetimeKey, toYYYYMMDD, date)
        const datesAttributes = attributes.filter(func)[0]
        assert(datesAttributes, `No data for date: ${filterDate}`)

        const cumulatedObject = cumulateObjects(attributes)

        const states = []
        for (const [ key, value ] of Object.entries(cumulatedObject)) {
          if (!nonStateKeys.includes(key)) {
            states.push({
              state: getIso2FromName({ country, name: key.replace('_', ' '), isoMap, nameToCanonical }),
              cases: value,
              date: filterDate
            })
          }
        }

        const summedData = transform.sumData(states, {
          deaths: datesAttributes[deathsKey],
          ICU: datesAttributes[icuKey],
          date: filterDate
        })
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: datesAttributes[casesKey] })
        states.push(summedData)
        return states
      }
    }
  ]
}
