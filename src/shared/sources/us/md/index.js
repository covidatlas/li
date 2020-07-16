// Migrated from coronadatascraper, src/shared/scrapers/US/MD/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const arcgis = require('../../_lib/arcgis.js')


module.exports = {
  state: 'iso2:US-MD',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://health.maryland.gov/',
    name: 'Maryland Department of Health',
  },
  scrapers: [
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'headless',
          data: 'paragraph',
          url: 'https://coronavirus.maryland.gov/',
        },
      ],
      scrape ($) {
        const counties = []
        const paragraph = $('p:contains("Number of Confirmed Cases:")')
              .next('p')
              .text()
        paragraph.split(')').forEach(splitCounty => {
          if (splitCounty.length > 1) {
            let county = parse.string(splitCounty.substring(0, splitCounty.indexOf('(')).trim())
            if (county !== 'Baltimore City') {
              county = geography.addCounty(county)
            }
            const cases = parse.number(splitCounty.substring(splitCounty.indexOf('(') + 1, splitCounty.length).trim())
            counties.push({
              county,
              cases
            })
          }
        })
        return counties
      }
    },
    {
      startDate: '2020-03-17',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/3d9ca88970dd4689a701354d7fa6830b_0.csv',
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          let countyName
          if (county.COUNTY === 'Baltimore City') {
            countyName = parse.string(county.COUNTY)
          } else {
            countyName = geography.addCounty(parse.string(county.COUNTY))
          }
          counties.push({
            county: countyName,
            cases: parse.number(county.COVID19Cases),
            deaths: parse.number(county.COVID19Deaths),
            recovered: parse.number(county.COVID19Recovered)
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
            const serverNumber = ''
            const dashboardId = 'c34e541dd8b742d993159dbebb094d8b'
            const layerName = 'MD_COVID19_Case_Counts_by_County'
            const url = await arcgis.csvUrl(
              client,
              serverNumber,
              dashboardId,
              layerName
            )
            console.log('got url = ' + url)
            return { url }
          }
        },
      ],
      scrape (data, date) {
        const counties = []
        for (const county of data) {
          let countyName
          if (county.COUNTY === 'Baltimore City') {
            countyName = parse.string(county.COUNTY)
          } else {
            countyName = geography.addCounty(parse.string(county.COUNTY))
          }
          if (date < '2020-04-03') {
            counties.push({
              county: countyName,
              cases: parse.number(county.COVID19Cases),
              deaths: parse.number(county.COVID19Deaths),
              recovered: parse.number(county.COVID19Recovered)
            })
          } else {
            counties.push({
              county: countyName,
              cases: parse.number(county.TotalCaseCount),
              deaths: parse.number(county.TotalDeathCount)
            })
          }
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    }
    // TODO (scrapers) us-md - stopped at 2020-05-19, new data is on arcgis
    // https://coronavirus.maryland.gov/datasets/mdcovid19-casesbycounty/data
    // https://coronavirus.maryland.gov/datasets/mdcovid19-confirmeddeathsbycounty/data
    // https://coronavirus.maryland.gov/datasets/mdcovid19-totalpopulationtestedbycounty/data
    // https://coronavirus.maryland.gov/datasets/mdcovid19-totalhospitalizations/data
    // https://coronavirus.maryland.gov/datasets/mdcovid19-totalcurrentlyhospitalizedacuteandicu
  ]
}
