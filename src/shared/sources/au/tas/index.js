const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')

const mapping = {
  ignore: [ 'Cases in Tasmania', 'New cases', 'Active' ],
  cases: 'Total cases',
  recovered: 'Recovered',
  deaths: 'Deaths'
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
      scrape ($, date, { normalizeKey, normalizeTable, transposeArrayOfArrays }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: '#table12451' })
        )

        const headingRowIndex = 0
        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[headingRowIndex], mapping)
        const dataRow = normalizedTable[normalizedTable.length - 1]
        const data = normalizeKey.createHash(propColIndices, dataRow)

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
