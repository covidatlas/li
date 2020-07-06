// Migrated from coronadatascraper, src/shared/scrapers/US/NJ/index.js


const srcShared = '../../../'
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-NJ',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  source:   {
    name: 'State of New Jersey Department of Health',
    url: 'https://www.nj.gov/health/cd/topics/covid2019_dashboard.shtml',
  },
  scrapers: [
    {
      startDate: '2020-03-14',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/8840fd8ac1314f5188e6cf98b525321c_0.csv',
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.COUNTY_LAB),
            cases: parse.number(county.Positives),
            tested: parse.number(county.Negatives) + parse.number(county.Positives)
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/84737ef7f760486293b6afa536f028e0_0.csv',
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.COUNTY_LAB),
            cases: parse.number(county.Field2 || 0)
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-25',
      crawl: [
        {
          type: 'csv',
          url: async (client) => {
            const ret = arcgis.csvUrl(client, 7, 'ec4bffd48f7e495182226eee7962b422', 'DailyCaseCounts')
            return { url: ret }
          }
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.COUNTY_LAB),
            cases: parse.number(county.TOTAL_CASES || 0)
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-31',
      crawl: [
        {
          type: 'csv',
          url: async (client) => {
            const ret = arcgis.csvUrl(client, 7, 'ec4bffd48f7e495182226eee7962b422', 'DailyCaseCounts')
            return { url: ret }
          }
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.COUNTY_LAB),
            cases: parse.number(county.TOTAL_CASE || 0),
            deaths: parse.number(county.DEATHS || 0)
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-04-01',
      crawl: [
        {
          type: 'csv',
          url: async (client) => {
            const ret = await arcgis.csvUrl(client, 7, 'ec4bffd48f7e495182226eee7962b422', 'DailyCaseCounts')
            return { url: ret }
          }
        }
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.COUNTY_LAB),
            cases: parse.number(county.TOTAL_CASES || 0),
            deaths: parse.number(county.DEATHS || 0)
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-04-30',
      crawl: [
        {
          type: 'csv',
          url: async (client) => {
            const ret = await arcgis.urlFromOrgId(client, 7, 'Z0rixLlManVefxqY', 'DailyCaseCounts')
            return { url: ret }
          }
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.COUNTY_LAB),
            cases: parse.number(county.TOTAL_CASES || 0),
            deaths: parse.number(county.TOTAL_DEATHS || 0)
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    }
  ]
}
