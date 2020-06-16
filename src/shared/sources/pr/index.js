const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')

const country = 'iso1:PR'

const mapping = {
  deaths: 'muertes​',
  tested: 'pruebas realizadas',
  cases: [ '​casos postivos', 'confirmados' ],

  // "prueba" = "test", but in (all of?) the PR data, the "tested"
  // values (prueba molecular, prueba serologica) are only used to
  // further break down how the positive cases were found.  e.g,:
  //
  // CASOS POSTIVOS ÚNICOS; PRUEBA MOLECULAR; PRUEBA SEROLÓGICA
  // 4,985; 1,364; 3,621
  null: [ 'en proceso', 'negativos', 'pruebas en proceso', 'prueba molecular', 'prueba serologica', 'casos probables' ]
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
      scrape ($, date, { normalizeKey }) {
        const tbl = $('table:contains("MUERTES")')
        const headings = $(tbl).find('th').toArray().map(th => $(th).text())
        const propColIndices = normalizeKey.propertyColumnIndices(headings, mapping)
        const dataRow = $(tbl).find('tr').eq(1).find('td').toArray().map(td => $(td).text())
        const data = normalizeKey.createHash(propColIndices, dataRow, { numeric: s => s.replace('.', '') })
        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
