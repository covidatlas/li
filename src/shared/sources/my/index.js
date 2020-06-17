const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')

const country = 'iso1:MY'

const mapping = {
  cases: 'positif',
  testedNegative: 'negatif',
  recovered: 'Pulih',
  icu: 'Rawatan Rapi',
  deaths: 'Kematian'
}

module.exports = {
  aggregate: 'country',
  country,
  priority: 1,
  friendly: {
    name: 'Ministry of Health Malaysia',
    url: 'https://www.moh.gov.my'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-05-05',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.moh.gov.my/index.php/pages/view/2019-ncov-wuhan'
        },
      ],
      scrape ($, date, {
        getDataWithTestedNegativeApplied, normalizeKey, normalizeTable, transposeArrayOfArrays
      }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: 'center > table' })
        )

        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[0], mapping)
        const dataRow = normalizedTable[normalizedTable.length - 1]
        const data = normalizeKey.createHash(propColIndices, dataRow)

        assert(data.cases > 0, 'Cases are not reasonable')
        return getDataWithTestedNegativeApplied(data)
      }
    }
  ]
}
