const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:IN'

const mapping = {
  state: 'name of state',
  deaths: 'death',
  cases: 'total confirmed cases',
  recovered: 'cured',
  active: 'active cases',
  ignore: 's. no.'
}

const isoMap = {
  // Non-unique gets mapped straight to ISO2
  "Dadra and Nagar Haveli and Daman and Diu": "iso2:IN-DN+iso2:IN-DD",
}

const nameToCanonical = {
  // Name differences get mapped to the canonical names
  Telengana: "Telangana",
  "Dadar Nagar Haveli": "Dadra and Nagar Haveli",
  "Dadra and Nagar Haveli and Daman and Diu": "Dadra and Nagar Haveli",
}

module.exports = {
  aggregate: 'state',
  country,
  friendly: {
    name: 'Ministry of Health and Family Welfare, Government of India',
    url: 'https://www.mohfw.gov.in/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-23',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://www.mohfw.gov.in/'
        }
      ],
      scrape ($, date, { assertTotalsAreReasonable, getIso2FromName, normalizeKey, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '#state-data' })

        const headingRowIndex = 0
        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[headingRowIndex], mapping)

        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.filter(row => row[0].match(/^\d/))

        const states = []
        stateDataRows.forEach((row) => {
          const stateData = normalizeKey.createHash(propColIndices, row)
          stateData.state = getIso2FromName({
            country,
            name: stateData.state,
            nameToCanonical,
            isoMap,
          })
          states.push(stateData)
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const indexForCases = propColIndices.cases
        const [ , ...nonHeaderRows ] = normalizedTable
        const casesFromTotalRow = parse.number(
          nonHeaderRows.find((row) => row.some((cell) => cell.startsWith("Total")))[indexForCases]
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
