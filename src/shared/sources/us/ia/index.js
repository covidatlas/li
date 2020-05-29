// Migrated from coronadatascraper, src/shared/scrapers/US/IA/index.js

const srcShared = "../../../"
const geography = require(srcShared + "sources/_lib/geography/index.js")
const parse = require(srcShared + "sources/_lib/parse.js")
const transform = require(srcShared + "sources/_lib/transform.js")

module.exports = {
  state: "iso2:US-IA",
  country: "iso1:US",
  aggregate: "county",
  headless: true,
  friendly: {
    url: "https://idph.iowa.gov",
    name: "IDPH",
    description: "Iowa Department of Public Health",
  },
  scrapers: [
    {
      startDate: "2020-03-13",
      crawl: [
        {
          type: "headless",
          data: "table",
          url: "https://idph.iowa.gov/emerging-health-issues/novel-coronavirus",
        },
      ],
      scrape ($) {
        const counties = []
        const $table = $(
          'caption:contains("Reported Cases in Iowa by County")'
        ).closest("table")
        const $trs = $table.find("tbody > tr:not(:last-child)")
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const county = geography.addCounty(
            $tr.find("td:first-child").text().replace(/[\d]*/g, "")
          )
          const cases = parse.number($tr.find("td:last-child").text())
          counties.push({
            county,
            cases,
          })
        })
        counties.push(transform.sumData(counties))
        return counties
      },
    },
    {
      startDate: "2020-03-19",
      crawl: [ { type: "raw", url: "" } ],
      scrape () {
        throw new Error("Iowa is putting an image on their site, not data!")
      },
    },
    {
      startDate: "2020-03-20",
      crawl: [
        {
          type: "csv",
          url:
            "https://opendata.arcgis.com/datasets/6a84756c2e444a87828bb7ce699fdac6_0.csv",
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          let countyName = county.Name
          if (countyName === "Obrien") {
            countyName = "O'Brien"
          }
          counties.push({
            county: geography.addCounty(countyName),
            cases: parse.number(county.Confirmed || 0),
            deaths: parse.number(county.Deaths || 0),
            recovered: parse.number(county.Recovered || 0),
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      },
    },
  ],
}