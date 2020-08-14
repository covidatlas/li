// Contributed to CDS by Spencer Lyon in
// https://github.com/covidatlas/coronadatascraper/pull/1032

const srcShared = '../../../'
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')


module.exports = {

  state: 'iso2:US-LA',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  timeseries: false,
  friendly:   {
    url: 'https://ready.nola.gov/incident/coronavirus/safe-reopening/',
    name: 'City of New Orleans Office of Homeland Security and Emergency Preparedness',
  },
  scrapers: [
    {
      startDate: '2020-08-14',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated(
            'https://services5.arcgis.com/O5K6bb5dZVZcTo5M/arcgis/rest/services/Cases_and_Deaths_by_Race_by_Parish_and_Region_2/FeatureServer/0/query'
          )
        },
      ],
      scrape (data) {
        const result = data.filter(d => d.PFIPS !== '0').map(d => {
          function sumFieldsStartingWith (s) {
            return Object.keys(d).
              filter(f => f.startsWith(s)).
              reduce((sum, f) => sum + d[f], 0)
          }
          return {
            county: `fips:${d.PFIPS}`,
            cases: sumFieldsStartingWith('Cases'),
            deaths: sumFieldsStartingWith('Deaths')
          }
        })

        return result
      }
    }
  ]
}
