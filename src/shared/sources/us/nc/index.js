const assert = require('assert')
const geography = require('../../../sources/_lib/geography/index.js')
const maintainers = require('../../../sources/_lib/maintainers.js')
const parse = require('../../../sources/_lib/parse.js')
const transform = require('../../../sources/_lib/transform.js')

module.exports = {
  aggregate: "county",
  country: "iso1:US",
  maintainers: [ maintainers.camjc ],
  priority: 1,
  state: "iso2:US-NC",
  scrapers: [
    {
      startDate: "2020-03-14",
      crawl: [
        {
          type: "csv",
          url:
            "https://opendata.arcgis.com/datasets/969678bce431494a8f64d7faade6e5b8_0.csv",
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: geography.addCounty(parse.string(county.County)),
            cases: parse.number(county.Total),
            deaths: parse.number(county.Deaths),
          })
        }
        const summedData = transform.sumData(counties)
        assert(summedData.cases > 0, 'Cases are not reasonable')
        counties.push(summedData)
        return counties
      },
    },
  ],
}
