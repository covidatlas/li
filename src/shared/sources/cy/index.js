const assert = require("assert")
const maintainers = require("../_lib/maintainers.js")
const timeseriesFilter = require("../_lib/timeseries-filter.js")
const parse = require("../_lib/parse.js")

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
          type: "csv",
          url: "https://data.gov.cy/node/4618/download?language=en",
        },
      ],
      scrape ($, date) {
        // Sample date: '13/3/2020' ... but sometimes they report the year as '20'.
        function toYYYYMMDD (datestring) {
          let [ d, m, y ] = datestring.split("/")
          if (y === '20')
            y = '2020'
          return [ y, m.padStart(2, "0"), d.padStart(2, "0") ].join("-")
        }

        const { filterDate, func } = timeseriesFilter(
          $,
          "date",
          toYYYYMMDD,
          date
        )

        const data = $.filter(func).map((d) => {
          return {
            cases: parse.number(d["total cases"]),
            deaths: parse.number(d["total deaths"]),
            recovered: parse.number(d["total recovered"]),
            tested: d["total tests"] === ":" ? undefined : parse.number(d["total tests"]),
            date: filterDate,
          }
        })

        assert(
          data[0].cases > 0,
          "Cases are not reasonable for date: " + filterDate
        )
        return data
      },
    },
  ],
}
