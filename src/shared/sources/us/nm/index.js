const assert = require("assert")
const geography = require("../../../sources/_lib/geography/index.js")
const maintainers = require("../../../sources/_lib/maintainers.js")
const parse = require("../../../sources/_lib/parse.js")
const transform = require("../../../sources/_lib/transform.js")

module.exports = {
  aggregate: "county",
  country: "iso1:US",
  maintainers: [ maintainers.camjc ],
  priority: 1,
  state: "iso2:US-NM",
  friendly: {
    url: "https://cv.nmhealth.org",
    name: "New Mexico Department of Health",
  },
  scrapers: [
    {
      startDate: "2020-03-23",
      crawl: [
        {
          data: "table",
          type: "page",
          url: "https://cv.nmhealth.org/cases-by-county/",
        },
      ],
      scrape ($) {
        const counties = []
        const $table = $('td:contains("County")').closest("table")
        assert.equal($table.length, 1, 'no table found')
        const $trs = $table.find("tbody > tr")
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const cases = parse.number($tr.find("td").eq(1).text())
          const deathText = $tr.find("td").eq(2).text()
          let deaths
          if (deathText) {
            if (deathText === "—") {
              deaths = 0
            } else {
              deaths = parse.number(deathText)
            }
          }
          const county = geography.addCounty(
            parse.string($tr.find("> *:first-child").text())
          )
          if (index < 1) {
            return
          }
          counties.push({
            county,
            cases,
            deaths,
          })
        })
        const summedData = transform.sumData(counties)
        assert(summedData.cases > 0, "Cases are not reasonable")
        counties.push(summedData)
        return counties
      },
    },
  ],
}
