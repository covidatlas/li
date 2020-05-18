const geography = require("../../_lib/geography/index.js")
const maintainers = require("../../_lib/maintainers.js")
const parse = require("../../_lib/parse.js")
const transform = require("../../_lib/transform.js")

const schemaKeysByHeadingFragment = {
  county: "county",
  cases: "cases",
  positive: "cases",
  deaths: "deaths",
  negative: "testedNegative",
  percent: null,
}

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
          getSchemaKeyFromHeading,
          normalizeTable,
        }
      ) {
        const normalizedTable = normalizeTable({
          $,
          tableSelector: 'table:contains("County")',
        })

        const headingRowIndex = 0
        const dataKeysByColumnIndex = []
        normalizedTable[headingRowIndex].forEach((heading, index) => {
          dataKeysByColumnIndex[index] = getSchemaKeyFromHeading({
            heading,
            schemaKeysByHeadingFragment,
          })
        })

        const totalsRowIndex = normalizedTable.length - 1
        // Create new array with just the county data (no headings, comments, totals)
        const countyDataRows = normalizedTable.filter(
          (row, index) => index !== 0 && index !== totalsRowIndex
        )

        let counties = []
        countyDataRows.forEach((row) => {
          const countyData = {}
          row.forEach((value, columnIndex) => {
            const key = dataKeysByColumnIndex[columnIndex]
            if (key) {
              countyData[key] = value
            }
          })

          counties.push(
            getDataWithTestedNegativeApplied({
              county: geography.addCounty(countyData.county.replace(/\W/g, "")),
              cases: countyData.cases
                ? parse.number(countyData.cases)
                : undefined,
              deaths: countyData.deaths
                ? parse.number(countyData.deaths)
                : undefined,
              testedNegative: countyData.testedNegative
                ? parse.number(countyData.testedNegative)
                : undefined,
            })
          )
        })

        const summedData = transform.sumData(counties)
        counties.push(summedData)

        const indexForCases = dataKeysByColumnIndex.findIndex(
          (key) => key === "cases"
        )

        const casesFromTotalRow = parse.number(
          normalizedTable[totalsRowIndex][indexForCases]
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
