const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const timeseriesFilter = require('../_lib/timeseries-filter.js')

const country = 'iso1:SA'

const sum = (items) => items.map(stateAttribute => stateAttribute.Cases).reduce((a, b) => Number(a) + Number(b), 0)

const nameToCanonical = {
  // Name differences get mapped to the canonical names
  Mecca: "Makka",
  Medina: "Madinah",
  Hail: "Hayel",
  Jouf: "Jawf",
  "Al Jouf": "Al Jawf",
}

module.exports = {
  aggregate: "state",
  country,
  priority: 1,
  timeseries: true,
  friendly: {
    name: "Saudi Center for Disease Prevention and Control",
    url: "https://covid19.cdc.gov.sa/",
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: "2020-01-14",
      crawl: [
        {
          type: 'csv',
          url: 'https://datasource.kapsarc.org/explore/dataset/saudi-arabia-coronavirus-disease-covid-19-situation/download/?format=csv&timezone=America/New_York&lang=en&use_labels_for_header=true&csv_separator=%2C',
          options: { timeout: 60000 }
        },
      ],
      scrape ($, date, { getIso2FromName, groupBy }) {
        assert($.length > 0, "data is unreasonable")
        const attributes = $.
              filter(r => r["Daily / Cumulative"] === "Cumulative").
              filter(r => r.region !== 'Total')

        // SA already reports dates as YYYY-MM-DD (eg '2020-06-16')
        const toYYYYMMDD = s => s
        const { filterDate, func } = timeseriesFilter(attributes, 'Date', toYYYYMMDD, date, { maxStaleDays: 30 })
        const dataAtDate = attributes.filter(func)

        const groupedByState = groupBy(dataAtDate, rec => rec.region)

        const states = []
        for (const [ stateName, recs ] of Object.entries(groupedByState)) {
          states.push({
            state: getIso2FromName({ country, name: stateName, nameToCanonical }),
            cases: sum(recs.filter(r => r.Indicator === "Cases")),
            active: sum(recs.filter(r => r.Indicator === "Active cases")),
            recovered: sum(recs.filter(r => r.Indicator === "Recoveries")),
            deaths: sum(recs.filter(r => r.Indicator === "Mortalities")),
            date: filterDate
          })
        }

        const summedData = { ...transform.sumData(states), date: filterDate }
        assert(summedData.cases > 0, "Cases are not reasonable")
        states.push(summedData)

        return states
      },
    },
  ],
}
