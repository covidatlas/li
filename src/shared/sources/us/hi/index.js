const geography = require("../../../sources/_lib/geography/index.js")
const maintainers = require("../../../sources/_lib/maintainers.js")
const parse = require("../../../sources/_lib/parse.js")
const transform = require("../../../sources/_lib/transform.js")

const _counties = [
  "Hawaii County",
  "Honolulu County",
  "Kauai County",
  "Maui County",
  "Kalawao County",
]

module.exports = {
  country: "iso1:US",
  state: "iso2:US-HI",
  priority: 1,
  maintainers: [ maintainers.jholt ],
  aggregate: "county",
  friendly: {
    name: "Hawaii Department of Health - Disease Outbreak Control Division",
    url: "https://health.hawaii.gov/docd/advisories/novel-coronavirus-2019/",
  },
  scrapers: [
    {
      startDate: "2020-03-26",
      crawl: [
        {
          type: "page",
          data: "list",
          url: "https://health.hawaii.gov/coronavirusdisease2019/",
        },
      ],
      scrape ($) {
        let counties = []
        const $list = $('dd:contains("Honolulu County")').parent().find("dd")
        $list.each((index, row) => {
          const text = $(row).text()
          if (!text.includes("County")) {
            return
          }
          const pieces = text.split(" ")
          const county = geography.addCounty(pieces[0].split("’").join(""))
          const cases = parse.number(pieces[2])
          counties.push({
            county,
            cases,
          })
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(
          counties,
          _counties,
          "county"
        )
        return counties
      },
    },
  ],
}
