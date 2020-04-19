const assert = require('assert')
const parse = require('../../_lib/parse.js')
const maintainers = require('../../_lib/maintainers.js')
const datetime = require('../../../datetime/index.js')
const spacetime = require('spacetime')


module.exports = {
  country: 'iso1:AU',
  timeseries: true,
  priority: 1,
  friendly: {
    name: 'Victoria State Government Health and Human Services',
    url: 'https://www.dhhs.vic.gov.au'
  },
  maintainers: [maintainers.camjc],
  scrapers: [
    {
      startDate: '2020-03-23',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: async () => {
            const date = datetime.cast(null, 'Australia/Melbourne')
            const dateFormatted = spacetime(date).subtract(1, 'day').format('{date}-{month}-{year}')
            const url = `https://www.dhhs.vic.gov.au/coronavirus-update-victoria-${dateFormatted}`
            console.log(url)
            return url
          }
        },
      ],
      scrape($) {
        const paragraph = $('.page-content p:first-of-type').text()
        const matches = paragraph.match(/cases in Victoria \w* (?<casesString>[\d,]+)/) || {}
        const { casesString } = matches.groups || {}
        const data = {
          cases: parse.number(casesString)
        }

        assert(data.cases > 0, 'Cases is not reasonable')
        return data
      }
    }
  ]
}
