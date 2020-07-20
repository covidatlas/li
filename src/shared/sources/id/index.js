const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')

const country = 'iso1:ID'

const mapping = {
  recovered: 'sembuh',
  deaths: 'meninggal',
  cases: 'positif covid-19',

  // pasien dalam pengawasan: "People in monitoring"
  // orang dalam pemantauan: "Patients under supervision"
  ignore: [ 'jumlah pdp', 'jumlah odp', 'jumlah suspek', 'jumlah spesimen' ]
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
      scrape ($, date, { normalizeKey, normalizeTable, transposeArrayOfArrays }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: '.covid-case-container table' })
        )

        const headingRowIndex = 0
        const headings = normalizedTable[headingRowIndex].map(s => s.replace('(Positif COVID-19)', ''))
        const propColIndices = normalizeKey.propertyColumnIndices(headings, mapping)
        const dataRow = normalizedTable[normalizedTable.length - 1]
        const data = normalizeKey.createHash(propColIndices, dataRow, { numeric: s => s.replace('.', '') })

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
