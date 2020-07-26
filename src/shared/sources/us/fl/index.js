// Migrated from coronadatascraper, src/shared/scrapers/US/FL/index.js

const srcShared = '../../../'
const assert = require('assert')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

const UNASSIGNED = '(unassigned)'

 /**
 * @param {{ Deaths: string?; FLResDeaths: string?; }} county
 */
function getDeaths (county) {
  return county.Deaths || county.FLResDeaths
}

const _counties = [
  'Alachua County',
  'Baker County',
  'Bay County',
  'Bradford County',
  'Brevard County',
  'Broward County',
  'Calhoun County',
  'Charlotte County',
  'Citrus County',
  'Clay County',
  'Collier County',
  'Columbia County',
  'DeSoto County',
  'Dixie County',
  'Duval County',
  'Escambia County',
  'Flagler County',
  'Franklin County',
  'Gadsden County',
  'Gilchrist County',
  'Glades County',
  'Gulf County',
  'Hamilton County',
  'Hardee County',
  'Hendry County',
  'Hernando County',
  'Highlands County',
  'Hillsborough County',
  'Holmes County',
  'Indian River County',
  'Jackson County',
  'Jefferson County',
  'Lafayette County',
  'Lake County',
  'Lee County',
  'Leon County',
  'Levy County',
  'Liberty County',
  'Madison County',
  'Manatee County',
  'Marion County',
  'Martin County',
  'Miami-Dade County',
  'Monroe County',
  'Nassau County',
  'Okaloosa County',
  'Okeechobee County',
  'Orange County',
  'Osceola County',
  'Palm Beach County',
  'Pasco County',
  'Pinellas County',
  'Polk County',
  'Putnam County',
  'St. Johns County',
  'St. Lucie County',
  'Santa Rosa County',
  'Sarasota County',
  'Seminole County',
  'Sumter County',
  'Suwannee County',
  'Taylor County',
  'Union County',
  'Volusia County',
  'Wakulla County',
  'Walton County',
  'Washington County',
]

const _countyMap =  {
  Dade: 'Miami-Dade',
  Desoto: 'DeSoto',
}

function _getCountyName (testCountyName) {
  const lowerCountyName = testCountyName.toLowerCase()
  for (const countyName of _counties) {
    if (countyName.toLowerCase() === lowerCountyName) {
      return countyName
    }
  }
  return transform.toTitleCase(testCountyName)
}


module.exports = {
  state: 'iso2:US-FL',
  country: 'iso1:US',
  priority: 1,
  aggregate: 'county',
  maintainers: [ maintainers.lazd ],
  friendly:   {
    url: 'http://www.floridahealth.gov',
    name: 'Florida Health',
  },
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'http://www.floridahealth.gov/diseases-and-conditions/COVID-19/index.html',
        },
      ],
      scrape ($) {
        const countiesMap = {}
        const $table = $('*:contains("Diagnosed in Florida")').closest('table')
        const $trs = $table.find('tr')
        $trs.each((index, tr) => {
          if (index < 2) {
            return
          }
          const $tr = $(tr)
          const county = geography.addCounty(parse.string($tr.find('td:nth-child(2)').text()))
          countiesMap[county] = countiesMap[county] || { cases: 0 }
          countiesMap[county].cases += 1
        })
        let counties = transform.objectToArray(countiesMap)
        const text = $('div:contains("Non-Florida Residents")')
              .last()
              .text()
        const nonFlorida = text.split(' \u2013 ')[0]
        if (nonFlorida) {
          counties.push({
            name: UNASSIGNED,
            cases: nonFlorida
          })
        }
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/b4930af3f43a48138c70bca409b5c452_0.csv',
        },
      ],
      scrape (data) {
        let counties = []
        for (const county of data) {
          counties.push({
            county: geography.addCounty(parse.string(county.County)),
            cases: parse.number(county.Counts)
          })
        }
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-20',
      crawl: [
        {
          type: 'json',
          url: 'https://services1.arcgis.com/CY1LXxl9zlJeBuRZ/arcgis/rest/services/Florida_Testing/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=true&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=4891&geometry=%7B%22xmin%22%3A-10018754.1713954%2C%22ymin%22%3A2504688.542850271%2C%22xmax%22%3A-7514065.628547024%2C%22ymax%22%3A5009377.085698649%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%2C%22latestWkid%22%3A3857%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&outSR=102100&resultType=tile',
        },
      ],
      scrape (data) {
        let counties = []
        for (const county of data.features) {
          let countyName = _getCountyName(geography.addCounty(parse.string(county.attributes.COUNTYNAME)))
          if (countyName === 'Unknown County') {
            countyName = UNASSIGNED
          }
          if (countyName === 'Dade County') {
            countyName = 'Miami-Dade County'
          }
          counties.push({
            county: countyName,
            cases: parse.number(county.attributes.T_positive || 0),
            tested: parse.number(county.attributes.T_total || 0),
            deaths: parse.number(county.attributes.FLandNonFLDeaths || 0)
          })
        }
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-25',
      crawl: [
        {
          type: 'csv',
          url: async client => {
            const dashId = '74c7375b03894e68920c2d0131eef1e6'
            const lname = 'Florida_Testing'
            const url = await arcgis.csvUrl(client, 1, dashId, lname)
            return url
          }
        }
      ],
      scrape (data) {
        let counties = []
        for (const county of data) {
          let countyName = _getCountyName(geography.addCounty(parse.string(county.COUNTYNAME)))
          if (countyName === 'Unknown County') {
            countyName = UNASSIGNED
          }
          if (countyName === 'Dade County') {
            countyName = 'Miami-Dade County'
          }
          counties.push({
            county: countyName,
            cases: parse.number(county.T_positive || 0),
            tested: parse.number(county.T_total || 0),
            deaths: parse.number(county.FLandNonFLDeaths || 0)
          })
        }
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-30',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/a7887f1940b34bf5a02c6f7f27a5cb2c_0.csv',
        },
      ],
      scrape (data) {
        assert(data, 'fetch unsuccessful')
        let result = []
        const unassigned = {
          county: UNASSIGNED,
          cases: 0,
          tested: 0,
          deaths: 0
        }
        for (const county of data) {
          let countyName = _countyMap[county.County_1] || county.County_1
          if (countyName.toLowerCase() === 'state') {
            result.push({
              cases: parse.number(county.CasesAll),
              tested: parse.number(county.T_total),
              deaths: parse.number(getDeaths(county))
            })
          }
          else if (countyName.toLowerCase() === 'unknown') {
            unassigned.cases += parse.number(county.CasesAll)
            unassigned.tested += parse.number(county.T_total)
            unassigned.deaths += parse.number(getDeaths(county))
          } else {
            countyName = geography.addCounty(parse.string(countyName))
            result.push({
              county: countyName,
              cases: parse.number(county.CasesAll),
              tested: parse.number(county.T_total),
              deaths: parse.number(getDeaths(county))
            })
          }
        }
        result.push(unassigned)
        result = geography.addEmptyRegions(result, _counties, 'county')
        result = result.filter(({ county }) => county !== UNASSIGNED)
        return result
      }
    }
  ]
}
