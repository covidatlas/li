const assert = require("assert")
const maintainers = require("../../../sources/_lib/maintainers.js")
const arcgis = require("../../../sources/_lib/arcgis.js")
const transform = require("../../../sources/_lib/transform.js")

module.exports = {
  aggregate: "county",
  country: "iso1:US",
  state: "iso2:US-NE",
  maintainers: [ maintainers.jzohrab ],
  priority: 1,
  friendly: {
    url: "https://covid19-nebraska.hub.arcgis.com/datasets/628578697fb24d8ea4c32fa0c5ae1843_0/geoservice?geometry=119.695%2C22.406%2C12.820%2C64.233&showData=true&where=(Confirmed%20%3E%200)",
    name: "Nebraska Coronavirus Response",
  },
  scrapers: [
    {
      startDate: "2020-08-16",
      crawl: [
        {
          type: "json",
          paginated: arcgis.paginated(
            'https://services1.arcgis.com/0MSEUqKaxRlEPj5g/arcgis/rest/services/ncov_cases_US/FeatureServer/0/query',
            {
              where: "province_state = 'Nebraska'"
            }
          )
        }
      ],
      scrape (data) {
        const newest = Math.max(...data.map(d => d.Last_Update))
        const now = Number(new Date())
        const newestDaysOld = (now - newest) / (1000 * 60 * 60 * 24)
        console.log(`Latest data is ${newestDaysOld} days old`)
        if (newestDaysOld > 7)
          throw new Error(`stale data? Latest data is ${newestDaysOld} days old`)

        const counties = data.map(d => {
          return {
            county: `fips:${d.FIPS}`,
            cases: d.Confirmed,
            deaths: d.Deaths,
            active: d.Active,
            // d.Recovered is always 0, don't use it.
            recovered: d.Confirmed - d.Active - d.Deaths
          }
        })

        const summedData = transform.sumData(counties)
        assert(summedData.cases > 0, "Cases are not reasonable")
        counties.push(summedData)
        return counties
      }
    }
  ]
}
