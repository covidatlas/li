const assert = require("assert")
const maintainers = require("../_lib/maintainers.js")
const parse = require('../_lib/parse.js')
const datetime = require("../../datetime/index.js")

const country = "iso1:CY"

module.exports = {
  aggregate: "country",
  country,
  timeseries: true,
  friendly: {
    name: "Official website for Cyprus Open Data",
    url: "https://data.gov.cy/",
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  priority: 1,
  scrapers: [
    {
      startDate: "2020-03-09",
      crawl: [
        {
          type: "json",
          url:
            "https://data.gov.cy/api/action/datastore/search.json?resource_id=611bd000-ce47-449b-b469-b4f50b960f61&limit=1000",
        },
      ],
      scrape ($, date) {
        const thisDatesRecord = $.result.records.find((record) => {
          const [ dd, mm, yy ] = record.date.split("/").map(Number)
          const recordDate = datetime.getYYYYMMDD(`20${yy}-${mm}-${dd}`)
          return recordDate === date
        })
        assert(thisDatesRecord, `data fetch failed, no record for date ${date}`)

        const data = {
          cases: parse.number(thisDatesRecord["total cases"]),
          deaths: parse.number(thisDatesRecord["total deaths"]),
          recovered: parse.number(thisDatesRecord["total recovered"]),
          tested: parse.number(thisDatesRecord["total tests"]),
        }

        assert(data.cases > 0, "Cases are not reasonable for date: " + date)
        return data
      },
    },
  ],
}
