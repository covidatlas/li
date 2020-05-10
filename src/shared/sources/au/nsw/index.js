const assert = require('assert')
const datetime = require('../../../datetime/index.js')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const schemaKeysByHeadingFragment = {
  'confirmed case': 'cases',
  'tested and excluded': 'testedNegative',
  'total persons tested': 'tested',
  deaths: 'deaths',
  recovered: 'recovered',
}

const getDeathsFromParagraph = $currentArticlePage => {
  const paragraph = $currentArticlePage('p:contains("deaths")').text()
  const matches = paragraph.match(/been (?<casesString>[\d,]+) deaths/) || {}
  const { casesString } = matches.groups || {}
  if (casesString && parse.number(casesString) > 0) {
    return parse.number(casesString)
  }
  return undefined
}

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-NSW',
  priority: 2,
  timeseries: true,
  friendly: {
    name: 'NSW Government Health',
    url: 'https://www.health.nsw.gov.au'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-01',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: async (client) => {
            const rssFeed = 'https://www.health.nsw.gov.au/_layouts/feed.aspx?xsl=1&web=/news&page=4ac47e14-04a9-4016-b501-65a23280e841&wp=baabf81e-a904-44f1-8d59-5f6d56519965&pageurl=/news/Pages/rss-nsw-health.aspx'
            const { body } = await client({ url: rssFeed })
            const localDate = datetime.cast(null, 'Australia/Sydney')
            const formattedDate = datetime.getYYYYMMDD(localDate).replace(/-/g, '')
            const regex = new RegExp(`statistics<\/title><link>(?<url>[a-zA-Z\/.:_]+?${formattedDate}.+?)<\/link>`)
            const matches = body.match(regex)
            const url = matches && matches.groups && matches.groups.url
            assert(url, `no url found for date: ${localDate}`)
            return { url }
          }
        }
      ],
      scrape ($, date, {
        getDataWithTestedNegativeApplied, getSchemaKeyFromHeading, normalizeTable, transposeArrayOfArrays
      }) {
        const [ , ...tableData ] = normalizeTable({ $, tableSelector: '.maincontent table:first-of-type' })
        const normalizedTable = transposeArrayOfArrays(tableData)

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({
            heading: heading.replace('(in NSW from confirmed cases)', ''),
            schemaKeysByHeadingFragment
          })
        })

        const dataRow = normalizedTable[normalizedTable.length - 1]

        const data = {}
        dataRow.forEach((value, columnIndex) => {
          const key = dataKeysByColumnIndex[columnIndex]
          data[key] = parse.number(value)
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        data.deaths = data.deaths || getDeathsFromParagraph($)
        return getDataWithTestedNegativeApplied(data)
      }
    }
  ]
}
