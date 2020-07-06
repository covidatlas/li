// Migrated from coronadatascraper, src/shared/scrapers/US/SD/index.js


const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


const _counties = [
  'Aurora County',
  'Beadle County',
  'Bennett County',
  'Bon Homme County',
  'Brookings County',
  'Brown County',
  'Brule County',
  'Buffalo County',
  'Butte County',
  'Campbell County',
  'Charles Mix County',
  'Clark County',
  'Clay County',
  'Codington County',
  'Corson County',
  'Custer County',
  'Davison County',
  'Day County',
  'Deuel County',
  'Dewey County',
  'Douglas County',
  'Edmunds County',
  'Fall River County',
  'Faulk County',
  'Grant County',
  'Gregory County',
  'Haakon County',
  'Hamlin County',
  'Hand County',
  'Hanson County',
  'Harding County',
  'Hughes County',
  'Hutchinson County',
  'Hyde County',
  'Jackson County',
  'Jerauld County',
  'Jones County',
  'Kingsbury County',
  'Lake County',
  'Lawrence County',
  'Lincoln County',
  'Lyman County',
  'Marshall County',
  'McCook County',
  'McPherson County',
  'Meade County',
  'Mellette County',
  'Miner County',
  'Minnehaha County',
  'Moody County',
  'Oglala Lakota County',
  'Pennington County',
  'Perkins County',
  'Potter County',
  'Roberts County',
  'Sanborn County',
  'Spink County',
  'Stanley County',
  'Sully County',
  'Todd County',
  'Tripp County',
  'Turner County',
  'Union County',
  'Walworth County',
  'Yankton County',
  'Ziebach County',
]


module.exports = {
  state: 'iso2:US-SD',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://doh.sd.gov',
    name: 'South Dakota Department of Health',
  },
  scrapers: [
    {
      startDate: '2020-03-15',
      crawl: [
        {
          type: 'page',
          url: 'https://doh.sd.gov/news/Coronavirus.aspx#SD',
        },
      ],
      scrape ($) {
        let counties = []
        const $th = $('h2:contains("South Dakota Counties with COVID-19 Cases")')
        const $table = $th.next('table')
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          counties.push({
            county: geography.addCounty(parse.string($tr.find('> *:first-child').text())),
            cases: parse.number($tr.find('> *:last-child').text())
          })
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'page',
          url: 'https://doh.sd.gov/news/Coronavirus.aspx#SD',
        },
      ],
      scrape ($) {
        let counties = []
        const $table = $('caption:contains("SOUTH DAKOTA COUNTIES WITH COVID-19 CASES")').closest('table')
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          if ($tr.find('td').attr('colspan')) {
            return
          }
          counties.push({
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:last-child').text())
          })
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-23',
      crawl: [
        {
          type: 'page',
          url: 'https://doh.sd.gov/news/Coronavirus.aspx#SD',
        },
      ],
      scrape ($) {
        let counties = []
        const $table = $('caption:contains("SD COUNTY OF RESIDENCE")').closest('table')
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          if ($tr.find('td').attr('colspan')) {
            return
          }
          counties.push({
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:last-child').text())
          })
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    }

    // TODO (scrapers) us-sd stopped working ~2020-04-20
    // Page https://doh.sd.gov/news/Coronavirus.aspx#SD currently is a PowerBI report.
  ]
}
