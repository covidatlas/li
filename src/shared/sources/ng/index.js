const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:NG'

const schemaKeysByHeadingFragment = {
  'state': 'state',
  'confirmed': 'cases',
  'admission': null,
  'discharged': 'recovered',
  'deaths': 'deaths',
}

module.exports = {
  aggregate: 'state',
  country,
  friendly: {
    name: 'Nigeria Center for Disease Control',
    url: 'https://covid19.ncdc.gov.ng/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-05-13',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://covid19.ncdc.gov.ng/'
        }
      ],
      scrape ($, date, { getIso2FromName, getSchemaKeyFromHeading, normalizeTable }) {
        const normalizedTable = normalizeTable({ $, tableSelector: '#custom1' })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        // Create new array with just the state data (no headings, comments, totals)
        const stateDataRows = normalizedTable.filter(row => row[row.length - 1].match(/^\d/))

        const states = []
        stateDataRows.forEach((row) => {
          const stateData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName({
              country, name: stateData.state.replace('FCT', 'Federal Capital Territory')
            }),
            cases: parse.number(stateData.cases),
            deaths: parse.number(stateData.deaths),
            recovered: parse.number(stateData.recovered)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable')
        return states
      }
    }
  ]
}
