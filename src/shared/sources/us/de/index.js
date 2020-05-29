// Migrated from coronadatascraper, src/shared/scrapers/US/DE/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

/** Filter to keep only good counties. */
function goodCounties (rec) {
  const badCounties = [
    'Pea Patch County',
    'Reedy Island County',
    'DE/NJ County',
    'Statewide County'
  ]
  return !badCounties.includes(rec.county)
}

function removeUnknown (rec) {
  return (rec.county !== 'Unknown County')
}

module.exports = {
  state: 'iso2:US-DE',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://www.dhss.delaware.gov/dhss/dph',
    name: 'DHSS Division of Public Health',
    description: 'Delaware Health and Social Services Division of Public Health',
  },
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.dhss.delaware.gov/dhss/dph/epi/2019novelcoronavirus.html'
        }
      ],
      scrape ($) {
        const $td = $('*:contains("County breakdown")')
              .closest('tr')
              .find('td:last-child')
        const counties = $td
              .html()
              .split('<br>')
              .map(str => {
                const parts = str.split(': ')
                return {
                  county: geography.addCounty(parse.string(parts[0])),
                  cases: parse.number(parts[1])
                }
              })
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-17',
      crawl: [
        {
          type: 'csv',
          url: 'http://opendata.arcgis.com/datasets/c8d4efa2a6bd48a1a7ae074a8166c6fa_0.csv',
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          const countyObj = {
            county: geography.addCounty(parse.string(county.NAME)),
            cases: parse.number(county.Presumptive_Positive),
            recovered: parse.number(county.Recovered)
          }
          counties.push(countyObj)
        }
        let results = counties.filter(goodCounties)
        results.push(transform.sumData(results))
        return results.filter(removeUnknown)
      }
    },
    {
      startDate: '2020-03-29',
      crawl: [
        {
          type: 'json',
          url: 'https://services1.arcgis.com/PlCPCPzGOwulHUHo/arcgis/rest/services/DEMA_COVID_County_Boundary_Time_VIEW/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&resultOffset=0&resultRecordCount=50&cacheHint=true',
        },
      ],
      scrape (data) {
        const counties = []
        for (const countyData of data.features) {
          const a = countyData.attributes
          if (typeof a.Presumptive_Positive !== 'undefined') {
            if (a.Presumptive_Positive === null) a.Presumptive_Positive = 0
            if (a.Total_Death === null) a.Total_Death = 0
            if (a.Recovered === null) a.Recovered = 0
            const countyObj = {
              county: geography.addCounty(parse.string(a.NAME)),
              cases: parse.number(a.Presumptive_Positive),
              deaths: parse.number(a.Total_Death),
              recovered: parse.number(a.Recovered)
            }
            counties.push(countyObj)
          }
        }
        let results = counties.filter(goodCounties)
        results.push(transform.sumData(results))
        return results.filter(removeUnknown)
      }
    }
  ]
}
