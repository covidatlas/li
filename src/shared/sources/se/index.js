const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const datetime = require('../../datetime/index.js')

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
        const attributes = $.features
          .map(({ attributes }) => attributes)
          .filter((item) => datetime.dateIsBeforeOrEqualTo(item[datetimeKey], date))

        assert(attributes.length > 0, `data fetch failed, no attributes for date: ${date}`)

        const datesAttributes = attributes.find(item =>
          date === datetime.getYYYYMMDD(item[datetimeKey])
        )
        assert(datesAttributes, `No data for date: ${date}`)

        const cumulatedObject = cumulateObjects(attributes)

        const states = []
        for (const [ key, value ] of Object.entries(cumulatedObject)) {
          if (!nonStateKeys.includes(key)) {
            states.push({
              state: getIso2FromName({ country, name: key.replace('_', ' '), isoMap, nameToCanonical }),
              cases: value
            })
          }
        }

        const summedData = transform.sumData(states, {
          deaths: datesAttributes[deathsKey],
          ICU: datesAttributes[icuKey],
        })
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: datesAttributes[casesKey] })
        states.push(summedData)
        return states
      }
    }
  ]
}
