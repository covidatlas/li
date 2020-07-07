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
        getDataWithTestedNegativeApplied, normalizeKey, normalizeTable, transposeArrayOfArrays
      }) {
        const [ , ...tableData ] = normalizeTable({ $, tableSelector: '.maincontent table:first-of-type' })
        const normalizedTable = transposeArrayOfArrays(tableData)

        const mapping = {
          cases: 'confirmed case',
          testedNegative: 'tested and excluded',
          tested: 'total persons tested',
          deaths: 'deaths',
          recovered: 'recovered',
        }

        const headings = normalizedTable[0].map(s => s.replace('(in NSW from confirmed cases)', ''))
        const propColIndices = normalizeKey.propertyColumnIndices(headings, mapping)
        const dataRow = normalizedTable[normalizedTable.length - 1]
        const data = normalizeKey.createHash(propColIndices, dataRow)
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
      // Rolling two-week window, starting on today's date. (!)  Crazy, right?
      startDate: new Date((new Date().getTime()-(86400000*14))).toJSON().substr(0,10),
      crawl: [
        {
          name: 'cases',
          type: 'json',
          url: 'https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/data_Cases2.json'
        },
        {
          name: 'tests',
          type: 'json',
          url: 'https://nswdac-covid-19-postcode-heatmap.azurewebsites.net/datafiles/data_tests.json'
        }
      ],
      scrape ({ cases }, date, { cumulateObjects }) {
        assert(cases.data.length > 0, 'cases data is unreasonable')

        // Add field, Date as YYYYMMDD.
        cases.data = cases.data.map(d => {
          const [ day, month ] = d.Date.split('-')
          // If it's January right now, and the data is 'Dec', then
          // that's from the previous year.
          // (Hopefully this source will be replaced by then ...
          // this logic and the scraper itself is a bit nuts.)
          const now = new Date()
          const nowMonth = now.getMonth()
          const nowYear = now.getFullYear()
          let useYear = nowYear
          if (month === 'Dec' && nowMonth === 0 /* Jan. */)
            useYear = useYear - 1
          d.YYYYMMDD = `${useYear}-${parseMonth(month)}-${day}`
          return d
        })

        // Filter to only scrape the latest date.
        const allDates = [ ...new Set(cases.data.map(d => d.YYYYMMDD)) ].sort()
        const latestDate = allDates.slice(-1)[0]

        let filterDate = date
        if (filterDate > latestDate)
          filterDate = latestDate
        console.log(`scraping data from ${filterDate}`)
        const byFilterDate = d => (d.YYYYMMDD === filterDate)

        const itemsByPOA = cases.data.filter(byFilterDate)
        assert(itemsByPOA.length > 0, `items for filter date ${filterDate} not found`)

        const cumulatedObject = cumulateObjects(itemsByPOA)

        const data = {
          cases: cumulatedObject.Cases,
          recovered: cumulatedObject.Recovered,
          deaths: cumulatedObject.Deaths,
          date: filterDate   // Explicitly set the date for the record.
        }

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
