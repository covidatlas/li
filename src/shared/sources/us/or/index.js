const geography = require("../../_lib/geography/index.js")
const maintainers = require("../../_lib/maintainers.js")
const parse = require("../../_lib/parse.js")
const transform = require("../../_lib/transform.js")

const allCounties = [
  "Baker County",
  "Benton County",
  "Clackamas County",
  "Clatsop County",
  "Columbia County",
  "Coos County",
  "Crook County",
  "Curry County",
  "Deschutes County",
  "Douglas County",
  "Gilliam County",
  "Grant County",
  "Harney County",
  "Hood River County",
  "Jackson County",
  "Jefferson County",
  "Josephine County",
  "Klamath County",
  "Lake County",
  "Lane County",
  "Lincoln County",
  "Linn County",
  "Malheur County",
  "Marion County",
  "Morrow County",
  "Multnomah County",
  "Polk County",
  "Sherman County",
  "Tillamook County",
  "Umatilla County",
  "Union County",
  "Wallowa County",
  "Wasco County",
  "Washington County",
  "Wheeler County",
  "Yamhill County",
]

module.exports = {
  aggregate: "county",
  state: "iso2:US-OR",
  country: "iso1:US",
  priority: 2,
  maintainers: [ maintainers.camjc ],
  friendly: {
    url: "https://www.oregon.gov/oha/PH",
    name: "Oregon Health Authority",
  },
  scrapers: [
    {
      startDate: "2020-03-13",
      crawl: [
        {
          data: "table",
          type: "page",
          url:
            "https://www.oregon.gov/oha/PH/DISEASESCONDITIONS/DISEASESAZ/Pages/emerging-respiratory-infections.aspx",
        },
      ],
      scrape (
        $,
        date,
        {
          assertTotalsAreReasonable,
          getDataWithTestedNegativeApplied,
          normalizeKey,
          normalizeTable,
        }
      ) {
        const normalizedTable = normalizeTable({
          $,
          tableSelector: 'table:contains("County")',
        })

        const headingRowIndex = 0
        const headings = normalizedTable[headingRowIndex]
        const mapping = {
          county: 'county',
          cases: [ 'cases', 'positive' ],
          deaths: 'deaths',
          testedNegative: 'negative',
          null: 'percent'
        }
        const propertyColIndices = normalizeKey.propertyColumnIndices(headings, mapping)

        // Create new array with just the county data (no headings, comments, totals)
        const totalsRowIndex = normalizedTable.length - 1
        // TODO: validate that the total row is in fact a total.
        const countyDataRows = normalizedTable.filter(
          (row, index) => index !== 0 && index !== totalsRowIndex
        )

        let counties = []
        countyDataRows.forEach((row) => {
          const countyData = normalizeKey.createHash(propertyColIndices, row)
          countyData.county = geography.addCounty(countyData.county.replace(/\W/g, ""))
          counties.push(getDataWithTestedNegativeApplied(countyData))
        })

        const summedData = transform.sumData(counties)
        counties.push(summedData)

        const casesFromTotalRow = parse.number(
          normalizedTable[totalsRowIndex][propertyColIndices.cases]
        )
        assertTotalsAreReasonable({
          computed: summedData.cases,
          scraped: casesFromTotalRow,
        })
        return geography.addEmptyRegions(counties, allCounties, "county")
      },
    },
  ],
}
