const assert = require("assert")
const maintainers = require("../_lib/maintainers.js")
const parse = require("../_lib/parse.js")
const timeseriesFilter = require('../_lib/timeseries-filter.js')

const country = "iso1:ZA"
const provinceList = [ "EC", "FS", "GP", "KZN", "LP", "MP", "NC", "NW", "WC" ]

module.exports = {
  country,
  timeseries: true,
  priority: 1,
  friendly: {
    name: "Coronavirus COVID-19 (2019-nCoV) Data Repository for South Africa",
    url: "https://github.com/dsfsi/covid19za",
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: "2020-03-05",
      crawl: [
        {
          name: "cases",
          url:
            "https://raw.githubusercontent.com/dsfsi/covid19za/master/data/covid19za_provincial_cumulative_timeline_confirmed.csv",
          type: "csv",
        },
        {
          name: "deaths",
          url:
            "https://raw.githubusercontent.com/dsfsi/covid19za/master/data/covid19za_timeline_deaths.csv",
          type: "csv",
        },
        {
          name: "tested",
          url:
            "https://raw.githubusercontent.com/dsfsi/covid19za/master/data/covid19za_timeline_testing.csv",
          type: "csv",
        },
      ],
      scrape (data, date) {
        const dataByProvince = {}
        const nationalData = {
          tested: 0,
          deaths: 0,
          cases: 0,
        }

        // ZA reports data as DD-MM-YYYY (e.g, '14-03-2020')
        function toYYYYMMDD (datestring) {
          const [ d, m, y ] = datestring.split('-')
          return [ y, m, d ].join('-')
        }

        const { func } = timeseriesFilter(data.cases, 'date', toYYYYMMDD, date)

        for (const item of data.cases.filter(func)) {
          for (const col of Object.keys(item)) {
            if (provinceList.findIndex((prov) => prov === col) !== -1) {
              dataByProvince[col] = {
                ...dataByProvince[col],
                state: `iso2:ZA-${col}`,
                cases:
                parse.number(item[col]) ||
                  (dataByProvince[col]
                   ? dataByProvince[col].cases
                   : undefined),
                deaths: 0,
              }
            } else if (col === "total") {
              nationalData.cases = parse.number(item[col])
            }
          }
        }

        assert(
          Object.keys(dataByProvince).length === 9,
          "Missing province data"
        )

        for (const item of data.tested) {
          if (toYYYYMMDD(item.date) <= date) {
            nationalData.tested =
              parse.number(item.cumulative_tests) || nationalData.tested
          }
        }

        for (const item of data.deaths) {
          if (toYYYYMMDD(item.date) <= date) {
            if (item.province) {
              dataByProvince[item.province].deaths += 1
            }

            nationalData.deaths += 1
          }
        }

        assert(nationalData.cases > 0, `National cases not reasonable for ${date}`)

        return [ nationalData, ...Object.values(dataByProvince) ]
      }
    }
  ]
}
