const assert = require("assert")
const geography = require("../../../sources/_lib/geography/index.js")
const maintainers = require("../../../sources/_lib/maintainers.js")
const parse = require("../../../sources/_lib/parse.js")
const transform = require("../../../sources/_lib/transform.js")
const { UNASSIGNED } = require("../../../sources/_lib/constants.js")

const _counties = [
  "Adams County",
  "Barnes County",
  "Benson County",
  "Billings County",
  "Bottineau County",
  "Bowman County",
  "Burke County",
  "Burleigh County",
  "Cass County",
  "Cavalier County",
  "Dickey County",
  "Divide County",
  "Dunn County",
  "Eddy County",
  "Emmons County",
  "Foster County",
  "Golden Valley County",
  "Grand Forks County",
  "Grant County",
  "Griggs County",
  "Hettinger County",
  "Kidder County",
  "LaMoure County",
  "Logan County",
  "McHenry County",
  "McIntosh County",
  "McKenzie County",
  "McLean County",
  "Mercer County",
  "Morton County",
  "Mountrail County",
  "Nelson County",
  "Oliver County",
  "Pembina County",
  "Pierce County",
  "Ramsey County",
  "Ransom County",
  "Renville County",
  "Richland County",
  "Rolette County",
  "Sargent County",
  "Sheridan County",
  "Sioux County",
  "Slope County",
  "Stark County",
  "Steele County",
  "Stutsman County",
  "Towner County",
  "Traill County",
  "Walsh County",
  "Ward County",
  "Wells County",
  "Williams County",
]

module.exports = {
  state: "iso2:US-ND",
  country: "iso1:US",
  aggregate: "county",
  maintainers: [ maintainers.camjc ],
  priority: 1,
  friendly: {
    name: "North Dakota Department of Health",
    url:
      "https://www.health.nd.gov/diseases-conditions/coronavirus/north-dakota-coronavirus-cases",
  },
  scrapers: [
    // // TODO: Reinstate this old scraper to get those 11 days.
    // {
    //   startDate: "2020-03-30",
    //   crawl: [
    //     {
    //       type: "page",
    //       url:
    //         "https://www.health.nd.gov/diseases-conditions/coronavirus/north-dakota-coronavirus-cases",
    //     },
    //   ],
    //   scrape ($, date, { normalizeTable }) {
    //     let counties = []

    //     const data = normalizeTable({
    //       $,
    //       tableSelector: 'table:contains("Positive")',
    //     })
    //     const _good_headers = (data) => {
    //       const col0 = parse.string(data[0][0])
    //       if (col0 !== "County" && col0 !== "County_State") {
    //         return false
    //       }
    //       if (parse.string(data[1][0]) !== "Total Tests") {
    //         return false
    //       }
    //       if (parse.string(data[2][0]) !== "Positive Cases") {
    //         return false
    //       }
    //       return true
    //     }
    //     if (!_good_headers(data)) {
    //       throw new Error("Unknown headers in html table")
    //     }
    //     const numRows = data[0].length
    //     const startRow = 1 // skip the headers
    //     for (let i = startRow; i < numRows; i++) {
    //       let county = parse.string(data[0][i]).split(",")[0]
    //       if (county === "") {
    //         continue
    //       }
    //       county = geography.addCounty(county)
    //       if (!_counties.includes(county)) {
    //         console.log(`  ⚠️  Unknown county in table: "${county}"`)
    //         continue
    //       }
    //       const tested = parse.number(parse.string(data[1][i]) || 0)
    //       const cases = parse.number(parse.string(data[2][i]) || 0)
    //       counties.push({
    //         county,
    //         cases,
    //         tested,
    //       })
    //     }
    //     counties = geography.addEmptyRegions(counties, _counties, "county")
    //     counties.push(transform.sumData(counties))
    //     return counties
    //   },
    // },
    {
      startDate: "2020-04-11",
      crawl: [
        {
          type: "csv",
          url: "https://static.dwcdn.net/data/yuhr0.csv",
        },
      ],
      scrape (data) {
        const counties = data.map((location) => {
          return {
            county:
              location.County === "Unknown"
                ? UNASSIGNED
                : geography.addCounty(location.County),
            cases: parse.number(location["Total Positive"]),
            tested: parse.number(location["Total Tested"]),
            // TODO: Recovered and Deaths exist now
          }
        })
        const summedData = transform.sumData(counties)
        counties.push(summedData)
        assert(summedData.cases > 0, "Cases are not reasonable")
        return geography.addEmptyRegions(counties, _counties, "county")
      },
    },
  ],
}
