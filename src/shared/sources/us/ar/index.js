const maintainers = require('../../_lib/maintainers.js')
const geography = require('../../_lib/geography/index.js')
const transform = require('../../_lib/transform.js')
const constants = require('../../_lib/constants.js')

const allCounties = [
  'Arkansas County',
  'Ashley County',
  'Baxter County',
  'Benton County',
  'Boone County',
  'Bradley County',
  'Calhoun County',
  'Carroll County',
  'Chicot County',
  'Clark County',
  'Clay County',
  'Cleburne County',
  'Cleveland County',
  'Columbia County',
  'Conway County',
  'Craighead County',
  'Crawford County',
  'Crittenden County',
  'Cross County',
  'Dallas County',
  'Desha County',
  'Drew County',
  'Faulkner County',
  'Franklin County',
  'Fulton County',
  'Garland County',
  'Grant County',
  'Greene County',
  'Hempstead County',
  'Hot Spring County',
  'Howard County',
  'Independence County',
  'Izard County',
  'Jackson County',
  'Jefferson County',
  'Johnson County',
  'Lafayette County',
  'Lawrence County',
  'Lee County',
  'Lincoln County',
  'Little River County',
  'Logan County',
  'Lonoke County',
  'Madison County',
  'Marion County',
  'Miller County',
  'Mississippi County',
  'Monroe County',
  'Montgomery County',
  'Nevada County',
  'Newton County',
  'Ouachita County',
  'Perry County',
  'Phillips County',
  'Pike County',
  'Poinsett County',
  'Polk County',
  'Pope County',
  'Prairie County',
  'Pulaski County',
  'Randolph County',
  'St. Francis County',
  'Saline County',
  'Scott County',
  'Searcy County',
  'Sebastian County',
  'Sevier County',
  'Sharp County',
  'Stone County',
  'Union County',
  'Van Buren County',
  'Washington County',
  'White County',
  'Woodruff County',
  'Yell County'
]

module.exports = {
  state: 'iso2:US-AR',
  country: 'iso1:US',

  friendly: {
    name: 'Arkanas Department of Health',
    url: 'https://www.healthy.arkansas.gov/programs-services/topics/novel-coronavirus'
  },
  maintainers: [ maintainers.aed3 ],
  aggregate: 'county',
  scrapers: [
    {
      startDate: '2020-03-23',
      crawl: [
        {
          url:
      'https://services.arcgis.com/PwY9ZuZRDiI5nXUB/ArcGIS/rest/services/ADH_COVID19_Positive_Test_Results/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*',
          type: 'json'
        }
      ],
      scrape (data) {
        let regions = []

        for (const countyData of data.features) {
          const attr = countyData.attributes
          if (attr.county_nam === 'Missing County Info') {
            attr.county_nam = constants.UNASSIGNED
          } else {
            attr.county_nam = geography.addCounty(attr.county_nam)
          }

          regions.push({
            county: attr.county_nam,
            cases: attr.positive,
            deaths: attr.deaths,
            recovered: attr.Recoveries,
            tested: attr.total_tests
          })
        }

        regions.push(transform.sumData(regions))
        regions = geography.addEmptyRegions(regions, allCounties, 'county')

        // TODO remove this once #28 is fixed
        regions = regions.filter(c => c.county !== constants.UNASSIGNED)

        console.log(regions)

        return regions
      }
    }
  ]
}
