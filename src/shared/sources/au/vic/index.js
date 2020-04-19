const assert = require('assert')
const parse = require('../../_lib/parse.js')
const maintainers = require('../../_lib/maintainers.js')
const datetime = require('../../../datetime/index.js')
const spacetime = require('spacetime')

const getLatestPublishedDay = ({ date, publishHour }) => {
  const dateAsSpacetime = spacetime(date)
  if (dateAsSpacetime.hour() < publishHour) { // TODO: This is returning 0, I need it to return the current hour in Aus/Melbourne
    dateAsSpacetime.subtract(1, 'day')
  }
  return dateAsSpacetime
}

module.exports = {
  country: 'iso1:AU',
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
            const dateFormatted = getLatestPublishedDay({ date, publishHour: 16 }).format('{date}-{month}-{year}')
            return `https://www.dhhs.vic.gov.au/coronavirus-update-victoria-${dateFormatted}`
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
