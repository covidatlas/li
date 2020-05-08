const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')

const country = 'iso1:MY'

const schemaKeysByHeadingFragment = {
  'positif': 'cases',
  'negatif': 'testedNegative',
  'Pulih': 'recovered',
  'Rawatan Rapi': 'icu',
  'Kematian': 'deaths',
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
        getDataWithTestedNegativeApplied, getSchemaKeyFromHeading, normalizeTable, transposeArrayOfArrays
      }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: 'center > table' })
        )

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({
            heading: heading,
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
        return getDataWithTestedNegativeApplied(data)
      }
    }
  ]
}
