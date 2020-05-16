const assert = require('assert')
const maintainers = require('../../../_lib/maintainers.js')
const datetime = require('../../../../datetime/index.js')

module.exports = {
  county: 'Sonoma County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  priority: 2,
  timeseries: true,
  friendly: {
    name: 'Sonoma County Emergency and Preparedness Information',
    url: 'https://socoemergency.org/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-02',
      crawl: [
        {
          type: 'json',
          url:
            'https://services1.arcgis.com/P5Mv5GY5S66M8Z1Q/ArcGIS/rest/services/NCOV_Cases_Sonoma_County/FeatureServer/0/query?where=1%3D1&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=pjson&token='
        }
      ],
      scrape ($, date) {
        assert($.features.length > 0, 'data is unreasonable')
        const attributes = $.features.map(({ attributes }) => attributes)
        assert(attributes.length > 0, `data fetch failed, no attributes`)

        const datesAttributes = attributes.find(item =>
          date === datetime.getYYYYMMDD(item.Date)
        )
        assert(datesAttributes, `No data for date: ${date}`)

        const data = {
          active: datesAttributes.Active,
          deaths: datesAttributes.Deaths,
          recovered: datesAttributes.Recovered,
          cases: datesAttributes.Cumulative,
        }
        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
