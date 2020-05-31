// Migrated from coronadatascraper, src/shared/scrapers/US/covidtracking.js

const srcShared = '../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

module.exports = {
  country: 'iso1:US',
  curators: [
    {
      name: 'The COVID Tracking Project',
      url: 'https://covidtracking.com/',
      twitter: '@COVID19Tracking',
      github: 'COVID19Tracking',
    },
  ],
  maintainers: [ maintainers.jzohrab ],
  tz: 'America/Los_Angeles',
  aggregate: 'state',
  priority: 0.5,
  scrapers: [
    {
      startDate: '2020-04-15',
      crawl: [
        {
          type: 'json',
          url: 'https://covidtracking.com/api/v1/states/current.json',
        },
      ],
      scrape (data) {
        const regions = []
        for (const stateData of data) {
          const stateObj = {
            state: `iso2:US-${stateData.state}`
          }
          if (stateData.death !== null) {
            stateObj.deaths = parse.number(stateData.death)
          }
          if (stateData.total !== null) {
            stateObj.tested = parse.number(stateData.total)
          }
          // Assume zero if none provided
          stateObj.cases = parse.number(stateData.positive || 0)
          regions.push(stateObj)
        }
        regions.push(transform.sumData(regions))
        return regions
      }
    }
  ]
}
