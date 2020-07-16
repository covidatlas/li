// Migrated from coronadatascraper, src/shared/scrapers/US/KY/index.js


const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-KY',
  priority: 1,
  aggregate: 'county',
  maintainers: [ maintainers.jholt, maintainers.jzohrab ],
  friendly:   {
    name: 'Kentucky Cabinet for Health and Family Services',
    url: 'https://www.kentucky.com/news/coronavirus/article241309406.html',
  },
  scrapers: [
    {
      // TODO (scrapers) fix us-ky start date.
      startDate: '1999-09-09',
      crawl: [
        {
          type: 'headless',
          url: 'https://datawrapper.dwcdn.net/BbowM/23/'
        },
      ],
      scrape ($, date, { csvParseSync }) {
        const counties = []
        // Extract raw csv from link attribute on Kentucky Health
        // Organizations data map.
        const href = $('a[class="dw-data-link"]').attr('href')
        const csvText = decodeURIComponent(href).
              replace('data:application/octet-stream;charset=utf-8,', '')

        const data = csvParseSync(csvText, { columns: true })

        const valueOf = (t) => t === 'null' ? 0 : parse.number(t)
        for (const county of data) {
          counties.push({
            county: geography.addCounty(county.County),
            cases: valueOf(county.Total),
            deaths: valueOf(county.Deaths),
            recovered: valueOf(county.Recovered)
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    }
  ]
}
