const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const mapping = {
  cases: 'confirmed case',
  testedNegative: 'negative',
  recovered: 'recovered',
  deaths: 'lives lost'
}

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-ACT',
  priority: 2,
  friendly: {
    name: 'ACT Government Health',
    url: 'https://www.health.act.gov.au'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-01',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19'
        }
      ],
      scrape ($, date, { getDataWithTestedNegativeApplied, normalizeKey }) {
        const $table = $('.statuscontent')
        const $trs = $table.find('div')
        const data = {
          deaths: 0,
          recovered: 0
        }
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const [ heading, value ] = $tr.text().split(': ')
          const key = normalizeKey.normalizeKey(heading, mapping)
          if (key) {
            data[key] = parse.number(value)
          }
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return getDataWithTestedNegativeApplied(data)
      }
    },
    {
      startDate: '2020-03-29',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.covid19.act.gov.au/updates/confirmed-case-information'
        }
      ],
      scrape ($, date, {
        getDataWithTestedNegativeApplied, normalizeKey, transposeArrayOfArrays, normalizeTable
      }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: 'h2:contains("Cases") + table' })
        )

        const headingRowIndex = 0
        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[headingRowIndex], mapping)

        const dataRow = normalizedTable[normalizedTable.length - 1]
        let data = normalizeKey.createHash(propColIndices, dataRow)

        assert(data.cases > 0, 'Cases are not reasonable')
        return getDataWithTestedNegativeApplied(data)
      }
    },
    {
      startDate: '2020-04-09',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.covid19.act.gov.au'
        }
      ],
      scrape ($, date, {
        getDataWithTestedNegativeApplied, normalizeKey, transposeArrayOfArrays, normalizeTable
      }) {
        const normalizedTable = transposeArrayOfArrays(
          normalizeTable({ $, tableSelector: '.spf-article-card--tabular table' })
        )

        const headingRowIndex = 0
        const propColIndices = normalizeKey.propertyColumnIndices(normalizedTable[headingRowIndex], mapping)

        const dataRow = normalizedTable[normalizedTable.length - 1]
        let data = normalizeKey.createHash(propColIndices, dataRow)

        assert(data.cases > 0, 'Cases are not reasonable')
        return getDataWithTestedNegativeApplied(data)
      }
    }
  ]
}
