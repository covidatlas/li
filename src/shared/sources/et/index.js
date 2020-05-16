const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')

const country = 'iso1:ET'

// NOTE: None are cumulative, and characters mean we can't use getSchemaKeyFromHeading util.
const schemaKeysByHeading = {
  '#': null,
  'የተያዙ': 'cases',
  'ያገገሙ': 'recovered',
  'ሞት': 'deaths',
  'የተመረመሩ': null,
  'ቀን': 'date',
}

module.exports = {
  country,
  timeseries: true,
  friendly: {
    name: 'COVID-19 Update Ethiopia',
    url: 'https://tena.et/update'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://tena.et/update'
        }
      ],
      scrape ($, date, { normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '#byDailyReport' })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = schemaKeysByHeading[heading]
        })

        // Create new array with just the state data (no headings, comments, totals)
        const dateDataRows = normalizedTable.filter(row => row[0].match(/^\d/))

        const dates = []
        dateDataRows.forEach((row) => {
          const dateData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            dateData[key] = value
          })

          dates.push({
            cases: parse.number(dateData.cases),
            deaths: parse.number(dateData.deaths),
            recovered: parse.number(dateData.recovered)
          })
        })
        console.log(dateDataRows)

        // TODO: Cumulate

        assert(dateDataRows.cases > 0, 'Cases are not reasonable')
        return dateDataRows
      }
    }
  ]
}
