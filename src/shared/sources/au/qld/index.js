const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const schemaKeysByHeadingFragment = {
  'cases to date': 'cases',
  'total confirmed': 'cases',
  'recovered cases': 'recovered',
  active: 'active',
  deaths: 'deaths',
  hhs: null,
}

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-QLD',
  friendly: {
    name: 'QLD Government Health',
    url: 'https://www.health.qld.gov.au'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: async (client) => {
            const { body } = await client({ url: 'https://www.health.qld.gov.au/news-events/doh-media-releases' })
            const matches = body.match(
              /<a href="(?<url>https:\/\/www\.health\.qld\.gov\.au\/news-events\/doh-media-releases.+?)"/
            )
            const url = matches && matches.groups && matches.groups.url
            assert(url, `no url found`)
            return ({ url })
          }
        }
      ],
      scrape ($, date, { getSchemaKeyFromHeading, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '#content table' })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        const dataRow = normalizedTable.find(row => row.some(cell => cell === 'Total'))

        const data = {}
        dataRow.forEach((value, columnIndex) => {
          const key = dataKeysByColumnIndex[columnIndex]
          if (key) {
            data[key] = parse.number(value)
          }
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
