const assert = require('assert')
const datetime = require('../../../datetime/index.js')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]
const parseMonth = (month) => `${months.findIndex((item) => item === month) + 1}`.padStart(2, '0')

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-NSW',
  priority: 2,
  timeseries: true,
  friendly: {
    name: 'NSW Government Health',
    url: 'https://www.nsw.gov.au/covid-19/find-facts-about-covid-19#nsw-covid-19-statistics'
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

        const schemaKeysByHeadingFragment = {
          'confirmed case': 'cases',
          'tested and excluded': 'testedNegative',
          'total persons tested': 'tested',
          deaths: 'deaths',
          recovered: 'recovered',
        }

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

        const getDeathsFromParagraph = $currentArticlePage => {
          const paragraph = $currentArticlePage('p:contains("deaths")').text()
          const matches = paragraph.match(/been (?<casesString>[\d,]+) deaths/) || {}
          const { casesString } = matches.groups || {}
          if (casesString && parse.number(casesString) > 0) {
            return parse.number(casesString)
          }
          return undefined
        }

        data.deaths = data.deaths || getDeathsFromParagraph($)
        return getDataWithTestedNegativeApplied(data)
      }
    },
    {
      startDate: '2020-03-25',
      crawl: [
        {
          name: 'cases',
          type: 'json',
          url: 'https://nswdac-np-covid-19-postcode-heatmap.azurewebsites.net/datafiles/data_Cases2.json'
        },
        {
          name: 'tests',
          type: 'json',
          url: 'https://nswdac-np-covid-19-postcode-heatmap.azurewebsites.net/datafiles/data_tests.json'
        }
      ],
      scrape ({ cases }, date, { cumulateObjects }) {
        assert(cases.data.length > 0, 'cases data is unreasonable')

        const itemsByPOA = cases.data
          .filter(({ Date: attributeDate }) => {
            const matches = attributeDate.match(/(?<day>\d+)-(?<month>\w+)/)
            const groups = matches && matches.groups || {}
            const { day, month } = groups
            return `2020-${parseMonth(month)}-${day}` === datetime.getYYYYMMDD(date)
          }
        )

        assert(itemsByPOA.length > 0, `items for date ${date} not found`)

        const cumulatedObject = cumulateObjects(itemsByPOA)

        const data = {
          cases: cumulatedObject.Cases,
          recovered: cumulatedObject.Recovered,
          deaths: cumulatedObject.Deaths,
        }

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
