const assert = require("assert")
const geography = require("../../../sources/_lib/geography/index.js")
const maintainers = require("../../../sources/_lib/maintainers.js")
const parse = require("../../../sources/_lib/parse.js")
const transform = require("../../../sources/_lib/transform.js")

const nameToCanonical = {
  // Name differences get mapped to the canonical names
  "Verm.": "Vermillion",
  "Vander.": "Vanderburgh",
  "St Joseph": "St. Joseph",
}

module.exports = {
  country: "iso1:US",
  state: "iso2:US-IN",
  priority: 1,
  aggregate: "county",
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: "2020-03-14",
      crawl: [
        {
          type: "csv",
          url:
            "https://opendata.arcgis.com/datasets/d14de7e28b0448ab82eb36d6f25b1ea1_0.csv",
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          let countyName = parse.string(county.COUNTYNAME)
          countyName = nameToCanonical[countyName] || countyName
          counties.push({
            county: geography.addCounty(countyName),
            cases: parse.number(county.Total_Positive),
            deaths: parse.number(county.Total_Deaths),
          })
        }
        const summedData = transform.sumData(counties)
        counties.push(summedData)
        assert(summedData.cases > 0, "Cases are not reasonable")
        return counties
      },
    },
  ],
}
