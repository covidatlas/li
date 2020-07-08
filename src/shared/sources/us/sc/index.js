// Migrated from coronadatascraper, src/shared/scrapers/US/SC/index.js


const srcShared = '../../../'
const datetime = require(srcShared + 'datetime/index.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')


const _counties = [
  'Abbeville County',
  'Aiken County',
  'Allendale County',
  'Anderson County',
  'Bamberg County',
  'Barnwell County',
  'Beaufort County',
  'Berkeley County',
  'Calhoun County',
  'Charleston County',
  'Cherokee County',
  'Chester County',
  'Chesterfield County',
  'Clarendon County',
  'Colleton County',
  'Darlington County',
  'Dillon County',
  'Dorchester County',
  'Edgefield County',
  'Fairfield County',
  'Florence County',
  'Georgetown County',
  'Greenville County',
  'Greenwood County',
  'Hampton County',
  'Horry County',
  'Jasper County',
  'Kershaw County',
  'Lancaster County',
  'Laurens County',
  'Lee County',
  'Lexington County',
  'McCormick County',
  'Marion County',
  'Marlboro County',
  'Newberry County',
  'Oconee County',
  'Orangeburg County',
  'Pickens County',
  'Richland County',
  'Saluda County',
  'Spartanburg County',
  'Sumter County',
  'Union County',
  'Williamsburg County',
  'York County',
]


module.exports = {
  state: 'iso2:US-SC',
  country: 'iso1:US',
  maintainers: [ maintainers.jzohrab ],
  source:   {
    name: 'South Carolina Department of Health and Environmental Control',
    url: 'https://www.scdhec.gov/infectious-diseases/viruses/coronavirus-disease-2019-covid-19/monitoring-testing-covid-19',
  },
  aggregate: 'county',
  scrapers: [
    {
      startDate: '2020-03-22',
      crawl: [
        {
          type: 'json',
          url: 'https://services2.arcgis.com/XZg2efAbaieYAXmu/arcgis/rest/services/COVID19_County_View/FeatureServer/0/query?f=json&where=Confirmed%20%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Confirmed%20desc&resultOffset=0&resultRecordCount=1000&cacheHint=true',
        },
      ],
      scrape (data) {
        let counties = []
        for (const record of data.features) {
          const rec = record.attributes
          const county = geography.addCounty(rec.NAME)
          const cases = rec.Confirmed
          const deaths = rec.Death
          const recovered = rec.Recovered
          counties.push({
            county,
            cases,
            deaths,
            recovered
          })
        }
        counties = geography.addEmptyRegions(counties, _counties, 'county')
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
            const serverNumber = 2
            const dashboardId = '3732035614af4246877e20c3a496e397'
            const layerName = 'Covid19_Cases_Centroid_SharingView'
            const ret = await arcgis.csvUrl(client, serverNumber, dashboardId, layerName)
            return ret
          }
        },
      ],
      scrape (data) {
        let counties = []
        for (const county of data) {
          counties.push({
            county: geography.addCounty(county.NAME),
            cases: parse.number(county.Confirmed),
            deaths: parse.number(county.Death),
            recovered: parse.number(county.Recovered)
          })
        }
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-28',
      crawl: [
        {
          type: 'csv',
          url: async (client) => {
            const serverNumber = 2
            const dashboardId = '3732035614af4246877e20c3a496e397'
            const layerName = 'COVID19_County_Polygon_SharingView2'  // they started updating this view
            const ret = await arcgis.csvUrl(client, serverNumber, dashboardId, layerName)
            return { url: ret }
          }
        },
      ],
      scrape (data) {
        // BOM hacking ... sigh.
        data = data.map(d => {
          if (d['ï»¿Date_'] && !d.Date_) d.Date_ = d['ï»¿Date_']
          return d
        })
        let counties = []
        for (const county of data) {
          // On 2020-4-28, SC switched from recording dates as UTC
          // (eg, "2020-04-27T18:13:20.273Z") to epoch (eg,
          // 1585082918049, an _integer_ = milliseconds from Jan 1,
          // 1970).  The Date constructor handles both of these.
          let d = county.Date_
          // Check if using epoch.
          if (d.match(/^\d+$/)) d = parseInt(d, 10)
          const countyDate = new Date(d)
          if (datetime.scrapeDateIsBefore(countyDate)) {
            throw new Error(`Data only available until ${countyDate}`)
          }
          counties.push({
            county: geography.addCounty(county.NAME),
            cases: parse.number(county.Confirmed),
            deaths: parse.number(county.Death)
          })
        }
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-07-08',
      crawl: [
        {
          type: 'json',
          url: 'https://services2.arcgis.com/XZg2efAbaieYAXmu/ArcGIS/rest/services/COVID19/FeatureServer/0/query?where=1%3D1&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&returnGeometry=false&outFields=NAME%2C+Confirmed%2C+Recovered%2C+Death&resultOffset=0&resultRecordCount=1000&returnExceededLimitFeatures=true&f=pjson'
        }
      ],
      scrape (data) {
        let counties = data.features.map(f => f.attributes).
              map(i => {
                return {
                  county: geography.addCounty(i.NAME),
                  cases: parse.number(i.Confirmed),
                  deaths: parse.number(i.Death)
                }
              })
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    }
  ]
}
