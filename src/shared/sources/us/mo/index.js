// Migrated from coronadatascraper, src/shared/scrapers/US/MO/index.js


const srcShared = '../../../'
const assert = require('assert')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')


const _countyMap = {
  'Kansas City': 'Jackson County',
  'St Louis': 'St. Louis County',
  'St Charles': 'St. Charles County',
  'St Clair': 'St. Clair County',
  'Ste Genevieve': 'Ste. Genevieve County',
  'St Francois': 'St. Francois County',
  'Joplin': 'Jasper County',
  'St Louis City': 'St. Louis City',
}

function _getCountyName (countyName) {
  countyName = _countyMap[countyName] || countyName
  if (!countyName.toUpperCase().includes(' CITY')) {
    countyName = geography.addCounty(countyName)
  }
  if (countyName === 'TBD County') {
    countyName = UNASSIGNED
  }
  return countyName
}


module.exports = {
  state: 'iso2:US-MO',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.paulboal, maintainers.jzohrab ],
  friendly:   {
    name: 'Missouri Department of Health and Senior Services',
    url: 'https://health.mo.gov/living/healthcondiseases/communicable/novel-coronavirus/'
  },
  scrapers: [
    {
      startDate: '2020-03-30',
      crawl: [
        {
          type: 'csv',
          url: async function (client) {
            const dashboardId = '6f2a47a25872470a815bcd95f52c2872'
            const layerName = 'lpha_boundry'
            const ret = await arcgis.csvUrl(client, '6', dashboardId, layerName)
            return { url: ret }
          }
        },
      ],
      scrape (data) {
        console.table(data)

        const counties = {}
        const unassigned = {
          county: UNASSIGNED,
          cases: 0,
          deaths: 0
        }
        for (const countyData of data) {
          let countyName = parse.string(countyData.NAME)
          if (countyName === 'TBD' || countyName === 'Out of State') {
            unassigned.cases += parse.number(countyData.Cases || 0)
            unassigned.deaths += parse.number(countyData.Deaths || 0)
          } else {
            countyName = _getCountyName(countyName)
            if (countyName in counties) {
              counties[countyName].cases += parse.number(countyData.Cases || 0)
              counties[countyName].deaths += parse.number(countyData.Deaths || 0)
            } else {
              // On 2020-4-28, MO switched from recording dates as UTC
              // (eg, "2020-04-27T18:13:20.273Z") to epoch (eg,
              // 1585082918049, an _integer_ = milliseconds from Jan 1,
              // 1970).  The Date constructor handles both of these.
              let d = countyData.EditDate
              // Check if using epoch.
              if (d.match(/^\d+$/)) d = parseInt(d, 10)
              const editDate = new Date(d)
              counties[countyName] = {
                cases: parse.number(countyData.Cases || 0),
                deaths: parse.number(countyData.Deaths || 0),
                publishedDate: editDate.toISOString()
              }
            }
          }
        }
        const countiesList = transform.objectToArray(counties)
        countiesList.push(unassigned)
        countiesList.push(transform.sumData(countiesList))
        return countiesList
      }
    },
    {
      startDate: '2020-08-04',
      crawl: [
        {
          // URL found by going to main Missouri covid app at
          // https://missouri-coronavirus-gis-hub-mophep.hub.arcgis.com/app/1aa9c96482d54ccfb309679015313fd2
          // and looking through the calls made to get county data.
          // Refs:
          // https://services6.arcgis.com/Bd4MACzvEukoZ9mR/ArcGIS/rest/services/county_MOHSIS_map/FeatureServer
          // https://services6.arcgis.com/Bd4MACzvEukoZ9mR/ArcGIS/rest/services/county_MOHSIS_map/FeatureServer/0
          type: 'json',
          url: 'https://services6.arcgis.com/Bd4MACzvEukoZ9mR/arcgis/rest/services/county_MOHSIS_map/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=NAME2%20asc&resultOffset=0&resultRecordCount=121&resultType=standard&cacheHint=true'
        }
      ],
      scrape (data) {
        const items = data.features.map(f => f.attributes)

        // Assume that all entries have the same date as the first.
        const d = new Date(items[0].EditDate)
        assert(d, 'Have EditDate')
        const entryDate = d.toISOString().split('T')[0]

        const counties = items.map(i => {
          [ 'NAME', 'CASES', 'DEATHS' ].forEach(f => {
            assert(i[f] !== undefined, `Have ${f} for ${i}`)
          })

          const countyName = _getCountyName(i.NAME)
          return {
            county: countyName,
            cases: i.CASES,
            deaths: i.DEATHS,
            date: entryDate
          }
        })

        const result = counties
        result.push({ ...transform.sumData(counties), date: entryDate })
        return result
      }
    }
  ]
}

