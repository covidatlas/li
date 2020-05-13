const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')

const country = 'iso1:PR'

const schemaKeysByHeadingFragment = {
  'muertes​': 'deaths',
  prueba: 'tested',
  realizadas: 'tested',
  '​casos postivos': 'cases',
  confirmados: 'cases',
  'en proceso': null,
  negativos: null
}

module.exports = {
  country,
  friendly: {
    name: 'Gobierno de Puerto Rico Departamento de Salud',
    url: 'http://www.salud.gov.pr/',
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-01-01',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'http://www.salud.gov.pr/Pages/coronavirus.aspx'
        }
      ],
      scrape ($, date, { getSchemaKeyFromHeading, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: 'table:contains("MUERTES")' })

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
          data[key] = parse.number(value.replace('.', ''))
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
