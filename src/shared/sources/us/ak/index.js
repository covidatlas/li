// Migrated from coronadatascraper, src/shared/scrapers/US/AK/index.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


const regions = {
  Anchorage: [ 'Anchorage Municipality' ],
  'Gulf Coast': [ 'Valdez-Cordova Census Area', 'Kodiak Island Borough', 'Kenai Peninsula Borough' ],
  Interior: [
    'Denali Borough',
    'Yukon-Koyukuk Census Area',
    'Southeast Fairbanks Census Area',
    'Fairbanks North Star Borough'
  ],
  'Mat-Su': [ 'Matanuska-Susitna Borough' ],
  Northern: [ 'Northwest Arctic Borough', 'Nome Census Area', 'North Slope Borough' ],
  Southeast: [
    'Yakutat City and Borough',
    'Skagway Municipality',
    'Hoonah-Angoon Census Area',
    'Wrangell City and Borough',
    'Haines Borough',
    'Petersburg Borough',
    'Prince of Wales-Hyder Census Area',
    'Sitka City and Borough',
    'Ketchikan Gateway Borough',
    'Juneau City and Borough'
  ],
  Southwest: [
    'Bristol Bay Borough',
    'Lake and Peninsula Borough',
    'Aleutians East Borough',
    'Dillingham Census Area',
    'Aleutians West Census Area',
    'Kusilvak Census Area', // aka 'Wade Hampton',
    'Bethel Census Area'
  ]
}


module.exports = {
  state: 'iso2:US-AK',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'http://dhss.alaska.gov/dph',
    name: 'Alaska Department of Health and Social Services',
    description: 'Division of Public Health',
  },
  scrapers: [
    {
      startDate: '2020-03-24',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'http://dhss.alaska.gov/dph/Epi/id/Pages/COVID-19/monitoring.aspx',
        },
      ],
      scrape ($) {

        const counties = []
        const $table = $('td:contains("Seward")').closest('table')
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const cases = parse.number($tr.find('td:last-child').text())
          let region = parse.string($tr.find('> *:first-child').text())
          // Later versions of the table changed the label
          if (region === 'Municipality of Anchorage') {
            region = 'Anchorage'
          }
          const name = `${region} Economic Region, AK, USA`
          const subCounties = regions[region]
          // Only process the rows which match an economic region
          if (!subCounties) {
            console.warn(`  ⚠️  AK, USA: Skipping ${name}, we don't yet know how to handle it`)
            return
          }
          const countyObj = {
            name,
            county: subCounties,
            cases
          }
          counties.push(countyObj)
        })
        counties.push(transform.sumData(counties))
        return counties

      }
    }
  ]
}
