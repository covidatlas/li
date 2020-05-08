const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')

const country = 'iso1:ID'

const schemaKeysByHeadingFragment = {
  sembuh: 'recovered',
  meninggal: 'deaths',
  'jumlah pdp': null, // pasien dalam pengawasan: "People in monitoring"
  'jumlah odp': null, // orang dalam pemantauan: "Patients under supervision"
  'positif covid-19': 'cases'
}

module.exports = {
  country,
  friendly: {
    name: 'Ministry of Health Republic of Indonesia',
    url: 'https://www.kemkes.go.id/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-23',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.kemkes.go.id/'
        }
      ],
      scrape ($, date, { getSchemaKeyFromHeading, normalizeTable, transposeArrayOfArrays }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: '.covid-case-container table' })
        )

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({
            heading: heading.replace('(Positif COVID-19)', ''),
            schemaKeysByHeadingFragment
          })
        })

        const dataRow = normalizedTable[normalizedTable.length - 1]

        const data = {}
        dataRow.forEach((value, columnIndex) => {
          const key = dataKeysByColumnIndex[columnIndex]
          data[key] = parse.number(value.replace('.', ''))
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
