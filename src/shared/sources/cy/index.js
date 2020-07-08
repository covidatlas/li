const assert = require("assert")
const maintainers = require("../_lib/maintainers.js")
const timeseriesFilter = require("../_lib/timeseries-filter.js")
const parse = require('../_lib/parse.js')

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

        // Sample date: '13/3/2020'
        function toYYYYMMDD (datestring) {
          const [ d, m, y ] = datestring.split('/')
          return [ y, m.padStart(2, '0'), d.padStart(2, '0') ].join('-')
        }

        const { filterDate, func } = timeseriesFilter($.result.records, 'date', toYYYYMMDD, date)

        const data = $.result.records.filter(func).map(d => {
          return {
            cases: parse.number(d["total cases"]),
            deaths: parse.number(d["total deaths"]),
            recovered: parse.number(d["total recovered"]),
            tested: parse.number(d["total tests"]),
            date: filterDate
          }
        })

        assert(data[0].cases > 0, "Cases are not reasonable for date: " + filterDate)
        return data
      }
    }
  ]
}
