// Migrated from coronadatascraper, src/shared/scrapers/US/MT/index.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

module.exports = {
  state: 'iso2:US-MT',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  scrapers: [
    {
      startDate: '2020-08-09',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated(
            'https://services.arcgis.com/qnjIrwR8z5Izc0ij/ArcGIS/rest/services/COVID_Cases_Production_View/FeatureServer/0/query',
            {
              outFields: 'NAMELABEL,Total,TotalDeaths,HospitalizationCount,TotalRecovered,TotalActive'
            }
          )
        },
      ],
      scrape (data) {
        const counties = data.map(d => {
          return {
            county: d.NAMELABEL,
            cases: d.Total,
            deaths: d.TotalDeaths,
            hospitalized_current: d.HospitalizationCount,
            recovered: d.TotalRecovered,
            active: d.TotalActive
          }
        })
        counties.push(transform.sumData(counties))
        return counties
      }
    }
  ]
}
