const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')
const { UNASSIGNED } = require('../_lib/constants.js')

const country = 'iso1:NZ'

const mapping = {
  state: 'dhb',
  deaths: 'deceased',
  recovered: 'recovered',
  cases: 'active',
  null: [ 'total', 'last 24 hours' ]
}

const nameToCanonical = { // Name differences get mapped to the canonical names
  'Capital and Coast': UNASSIGNED,
  'Counties Manukau': UNASSIGNED,
  'Hutt Valley': UNASSIGNED,
  'Lakes': UNASSIGNED,
  'Mid Central': UNASSIGNED,
  'Nelson Marlborough': UNASSIGNED,
  'South Canterbury': UNASSIGNED,
  'Southern': UNASSIGNED,
  'Tairāwhiti': UNASSIGNED,
  'Wairarapa': UNASSIGNED,
  'Waitematā': UNASSIGNED
}

module.exports = {
  aggregate: 'state',
  country,
  friendly: {
    name: 'New Zealand Government Ministry of Health',
    url: 'https://www.health.govt.nz'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-04-07',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://www.health.govt.nz/our-work/diseases-and-conditions/covid-19-novel-coronavirus/covid-19-current-situation/covid-19-current-cases'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, normalizeKey, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: 'table:contains("Total cases by DHB")' })

        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[0], mapping)

        const dataRows = normalizedTable.slice(1, -1)
        const statesCount = 20
        assert.equal(dataRows.length, statesCount, 'Wrong number of rows found')

        const states = []
        dataRows.forEach(row => {
          const stateData = normalizeKey.createHash(propColIndices, row)
          if (stateData.deaths === undefined)
            stateData.deaths = 0
          stateData.state = getIso2FromName({ country, name: stateData.state, nameToCanonical })
          states.push(stateData)
        })
        // TODO (scrapers) NZ scraper handles (unassigned) states incorrectly, needs to aggregate
        // Currently, NZ contains multiple rows for (unassigned) for each date, b/c multiple states
        // are mapped to (unassigned) with the nameToCanonical mapping.  e.g.,
        //
        // iso1:NZ/iso2:(unassigned)/undefined
        // date; cases; recovered; deaths
        // 2020-04-16; 43; 46; 2
        // 2020-04-16; 48; 61; 0
        // We should filter these out and summarize them.
        // See us-mi source for example.

        const summedData = transform.sumData(states)
        states.push(summedData)

        const tableWithoutHeadingRow = normalizedTable.slice(1)
        const casesFromTotalRow = parse.number(
          tableWithoutHeadingRow.find(row => row.some(cell => cell === 'Total'))[propColIndices.cases]
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
