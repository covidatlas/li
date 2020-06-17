const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')

const mapping = {
  cases: [ 'cases to date', 'total confirmed' ],
  recovered: 'recovered cases',
  active: 'active',
  deaths: 'deaths',
  ignore: 'hhs'
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
      scrape ($, date, { normalizeKey, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '#content table' })
        const headingRowIndex = 0
        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[headingRowIndex], mapping)
        const dataRow = normalizedTable.find(row => row.some(cell => cell === 'Total'))
        const data = normalizeKey.createHash(propColIndices, dataRow)
        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
