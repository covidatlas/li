const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const datetime = require('../../datetime/index.js')

const country = 'iso1:VN'
module.exports = {
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: 'Ministry of Health Vietnam',
    url: 'https://ncov.moh.gov.vn/ban-do-vn'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-22',
      crawl: [
        {
          type: 'json',
          url:
            'https://maps.vnpost.vn/apps/covid19/api/patientapi/list'
        }
      ],
      scrape ($, date) {
        const { data } = $
        assert(data.length > 0, 'data is unreasonable')
        const attributes = data
          .filter((item) => {
            if (!item.verifyDate.startsWith('202')) { // Some dates are in other years like year 0001.
              return false
            }
            const parsedDate = datetime.parse(item.verifyDate)
            return datetime.dateIsBeforeOrEqualTo(parsedDate, date)
          })

        const output = { cases: attributes.length }
        assert(output.cases > 0, 'Cases are not reasonable')
        return output
      }
    }
  ]
}
