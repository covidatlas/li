const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const schemaKeysByHeadingFragment = {
  'Cases in Tasmania': null,
  'New cases': null,
  'Total cases': 'cases',
  Active: null,
  Recovered: 'recovered',
  Deaths: 'deaths'
}

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-TAS',
  priority: 2,
  friendly: {
    name: 'Tasmanian Government',
    url: 'https://www.coronavirus.tas.gov.au/facts/cases-and-testing-updates'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-05-01',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.coronavirus.tas.gov.au/facts/cases-and-testing-updates'
        }
      ],
      scrape ($, date, { getSchemaKeyFromHeading, normalizeTable, transposeArrayOfArrays }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: '#table12451' })
        )

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        const dataRow = normalizedTable[normalizedTable.length - 1]

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
