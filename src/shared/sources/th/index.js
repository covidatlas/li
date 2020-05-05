const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')

const UNASSIGNED = '(unassigned)'

module.exports = {
  aggregate: 'state',
  country: 'iso1:TH',
  priority: 1,
  friendly: {
    name: 'Thailand Ministry of Public Health',
    url: 'https://ddc.moph.go.th/viralpneumonia/eng/index.php'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-05-05',
      crawl: [
        {
          name: 'states',
          type: 'json',
          url: 'https://ddcportal.ddc.moph.go.th/arcgis/rest/services/iT_Neillgis/thai_prov_region/FeatureServer/0/query?where=0%3D0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson'
        },
        {
          name: 'country',
          type: 'json',
          url: 'https://ddcportal.ddc.moph.go.th/arcgis/rest/services/iT_Neillgis/thai_cities/FeatureServer/0/query?where=0%3D0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=*&returnGeometry=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson',
        }
      ],
      scrape ({ states, country }) {
        assert(states.features.length > 1, 'features are unreasonable')
        const stateAttributes = states.features.map(({ attributes }) => attributes)

        assert(stateAttributes.length > 1, 'data fetch failed, no attributes')
        const output = stateAttributes.map(item => ({
          state: 'iso2:TH' + item.PROV_CODE.replace('00', UNASSIGNED),
          cases: item.Count_Confirm,
          hospitalized: item.Count_Admission,
          recovered: item.Count_Recovery,
          deaths: item.Count_Death,
          tested: item.Count_Total,
        }))

        const { attributes: countryAttributes } = country.features[0]
        const countryOutput = {
          cases: countryAttributes.Confirmed,
          deaths: countryAttributes.Deaths,
          icu: countryAttributes.Critical,
          recovered: countryAttributes.Recovered
        }

        output.push(countryOutput)
        assert(countryOutput.cases > 0, 'Cases are not reasonable')
        // NOTE: The counts at the state level sum up to be much lower than the country levels.

        return output
      }
    }
  ]
}
