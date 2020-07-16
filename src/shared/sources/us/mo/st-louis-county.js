// Migrated from coronadatascraper, src/shared/scrapers/US/MO/st-louis-county.js


const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')

module.exports = {
  county: 'fips:29189',
  state: 'iso2:US-MO',
  country: 'iso1:US',
  aggregate: 'county',
  priority: 1,
  headless: true,
  maintainers: [ maintainers.slezakbs, maintainers.jzohrab ],
  friendly:   {
    url: 'https://stlouisco.com/Your-Government/County-Executive/COVID-19',
    name: 'St. Louis County COVID-19 page',
  },
  scrapers: [
    {
      // TODO (scrapers) fix us-mo-st-louis-county start date
      startDate: '2020-03-14',
      crawl: [
        {
          type: 'csv',
          url: async (client) => {
            const serverNumber = '2'
            const orgId = 'w657bnjzrjguNyOy'
            const layerName = 'StLouisCounty_Bdy_Geo'
            const url = await arcgis.urlFromOrgId(
              client,
              serverNumber,
              orgId,
              layerName)
            return { url }
          }
        },
      ],
      scrape (rows) {
        const data = rows[0]
        // On 2020-4-28, MO switched from recording dates as UTC
        // (eg, "2020-04-27T18:13:20.273Z") to epoch (eg,
        // 1585082918049, an _integer_ = milliseconds from Jan 1,
        // 1970).  The Date constructor handles both of these.
        let d = data.edit_date
        // Check if using epoch.
        if (d.match(/^\d+$/)) d = parseInt(d, 10)
        const editDate = new Date(d)
        return {
          cases: parse.number(data.Cumulative_Cases),
          deaths: parse.number(data.Deaths),
          recovered: parse.number(data.Cases_Recovered),
          publishedDate: editDate.toISOString()
        }
      }
    }
    // TODO (scrapers) update scraper to include 'tested' ('test_admin'), maybe change source.
  ]
}
