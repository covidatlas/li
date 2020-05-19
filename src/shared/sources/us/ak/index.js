// Migrated from coronadatascraper, src/shared/scrapers/US/AK/index.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const assert = require('assert')

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
        console.log('table length = ')
        console.log($table.length)
        const $trs = $table.find('tbody > tr')
        let foundTrs = false
        $trs.each((index, tr) => {
          foundTrs = true
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
        assert(foundTrs, 'found Trs')
        counties.push(transform.sumData(counties))

        // TODO (scraper) the parsing here does not work, needs fixing or replacing.
        // The 'county' in the returned data is an array, which doesn't work when it
        // comes to normalizing and determining fips codes.
        //
        // The parsing creates data that looks like this:
        // { "name":"Anchorage Economic Region, AK, USA",
        //   "county":["Anchorage Municipality"], "cases":67}
        // and Li throws an error when trying to process it:
        //
        // TypeError: county.startsWith is not a function
        //    at lookupFIPS ( li/src/events/scraper/normalize-data/_normalize-us.js:40:27)
        //    at li/src/events/scraper/normalize-data/index.js:20:16
        console.log(JSON.stringify(counties))

        return counties
      }
    }

    // TODO (scraper): scrape new arcgis data

    // Timeseries of data - at the state level only.  This should go in its own source.
    // https://coronavirus-response-alaska-dhss.hub.arcgis.com/datasets/ ...
    //     daily-cases-hospitalizations-and-deaths

    // https://coronavirus-response-alaska-dhss.hub.arcgis.com/datasets/ ...
    //     geographic-distribution-of-confirmed-cases
    //     geographical-distribution-of-tests

    // The arcgis data appears to use the same region names as above,
    // but some of these datasets are broken down by the smaller
    // regions.
    // fips data: https://en.wikipedia.org/wiki/List_of_boroughs_and_census_areas_in_Alaska
  ]
}
