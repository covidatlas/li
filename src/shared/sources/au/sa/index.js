const assert = require('assert')
const datetime = require('../../../datetime/index.js')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const schemaKeysByHeadingFragment = {
  'confirmed case': 'cases',
  deaths: 'deaths',
  icu: 'icu',
  'cases cleared': 'recovered',
  type: null
}

const firstUrl =
  'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia'
const secondUrl =
  'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/conditions/infectious+diseases/covid+2019/latest+updates/covid-19+cases+in+south+australia'


module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-SA',
  friendly: {
    name: 'SA Health',
    url: 'https://www.sahealth.sa.gov.au'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-01',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: firstUrl
        }
      ],
      scrape ($) {
        const paragraph = $('.middle-column p:first-of-type').text()
        const { casesString } = paragraph.match(/been (?<casesString>\d+) confirmed cases/).groups
        return {
          cases: parse.number(casesString)
        }
      }
    },
    {
      startDate: '2020-03-27',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: () => {
            if (datetime.dateIsBeforeOrEqualTo(datetime.cast(null, 'Australia/Adelaide'), '2020-04-21')) {
              return { url: firstUrl }
            }
            return { url: secondUrl }
          }
        }
      ],
      scrape ($, date, { getSchemaKeyFromHeading, normalizeTable, transposeArrayOfArrays }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: 'table:first-of-type' })
        )

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
        })

        const dataRow = normalizedTable[normalizedTable.length - 1]

        const data = {}
        dataRow.forEach((value, columnIndex) => {
          const key = dataKeysByColumnIndex[columnIndex]
          if (key) {
            data[key] = parse.number(value)
          }
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
