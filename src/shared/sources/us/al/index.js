// Migrated from coronadatascraper, src/shared/scrapers/US/AL/index.js

const srcShared = '../../../'
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


const counties = [
  'Autauga County',
  'Baldwin County',
  'Barbour County',
  'Bibb County',
  'Blount County',
  'Bullock County',
  'Butler County',
  'Calhoun County',
  'Chambers County',
  'Cherokee County',
  'Chilton County',
  'Choctaw County',
  'Clarke County',
  'Clay County',
  'Cleburne County',
  'Coffee County',
  'Colbert County',
  'Conecuh County',
  'Coosa County',
  'Covington County',
  'Crenshaw County',
  'Cullman County',
  'Dale County',
  'Dallas County',
  'DeKalb County',
  'Elmore County',
  'Escambia County',
  'Etowah County',
  'Fayette County',
  'Franklin County',
  'Geneva County',
  'Greene County',
  'Hale County',
  'Henry County',
  'Houston County',
  'Jackson County',
  'Jefferson County',
  'Lamar County',
  'Lauderdale County',
  'Lawrence County',
  'Lee County',
  'Limestone County',
  'Lowndes County',
  'Macon County',
  'Madison County',
  'Marengo County',
  'Marion County',
  'Marshall County',
  'Mobile County',
  'Monroe County',
  'Montgomery County',
  'Morgan County',
  'Perry County',
  'Pickens County',
  'Pike County',
  'Randolph County',
  'Russell County',
  'St. Clair County',
  'Shelby County',
  'Sumter County',
  'Talladega County',
  'Tallapoosa County',
  'Tuscaloosa County',
  'Walker County',
  'Washington County',
  'Wilcox County',
  'Winston County',
]

module.exports = {
  state: 'iso2:US-AL',
  country: 'iso1:US',
  aggregate: 'county',
  friendly:   {
    name: 'Alabama Department of Public Health - Division of Infectious Diseases & Outbreaks',
    url: 'http://www.alabamapublichealth.gov/infectiousdiseases/2019-coronavirus.html',
  },
  maintainers: [ maintainers.chunder, maintainers.lazd ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'http://www.alabamapublichealth.gov/infectiousdiseases/2019-coronavirus.html',
        },
      ],
      scrape ($) {
        let result = []
        const $table = $('td:contains("(COVID-19) in Alabama")').closest('table')
        const $trs = $table.find('tbody > tr:not(:last-child)')
        $trs.each((index, tr) => {
          if (index < 2) {
            return
          }
          const $tr = $(tr)
          const countyName = geography.addCounty(parse.string($tr.find('td:first-child').text()))
          if (countyName === 'Out of State County') {
            return
          }
          result.push({
            county: countyName,
            cases: parse.number($tr.find('td:last-child').text())
          })
        })
        result = geography.addEmptyRegions(result, counties, 'county')
        result.push(transform.sumData(result))
        return result
      }
    },
    {
      startDate: '2020-03-26',
      crawl: [
        {
          type: 'csv',
          url: async function (client) {
            const orgid = '4RQmZZ0yaZkGR1zy'
            const layer = 'COV19_Public_Dashboard_ReadOnly'
            const ret = await arcgis.urlFromOrgId(client, 7, orgid, layer)
            console.log(`Calling arcgis url ${ret}`)
            return ret
          }
        },
      ],
      scrape (data) {

        let result = []
        for (const row of data) {
          const county = geography.addCounty(row.CNTYNAME)
          const cases = parse.number(row.CONFIRMED)
          const deaths = parse.number(row.DIED)
          // console.log(county, cases, deaths)
          result.push({
            county,
            cases,
            deaths
          })
        }
        result = geography.addEmptyRegions(result, counties, 'county')
        result.push(transform.sumData(result))
        return result
      }
    }
  ]
}
