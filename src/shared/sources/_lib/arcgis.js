/**
 * Open the arcgis iframe and look in the Network/XHR tab for requests with Name of "0".
 *
 * Like this one:
 * https://services7.arcgis.com/4RQmZZ0yaZkGR1zy/arcgis/rest/services/COVID19_testsites_READ_ONLY/FeatureServer/0?f=json
 *
 * serverNumber is 7, from services7.arcgis.com
 * orgId is 4RQmZZ0yaZkGR1zy
 * layerName is COVID19_testsites_READ_ONLY
 */
async function urlFromOrgId (client, serverNumber, orgId, layerName) {
  const url = `https://services${serverNumber}.arcgis.com/${orgId}/arcgis/rest/services/${layerName}/FeatureServer/0?f=json`
  const { body } = await client( { url } )
  const { serviceItemId } = body
  return `https://opendata.arcgis.com/datasets/${serviceItemId}_0.csv`
}


module.exports = {
  urlFromOrgId
}
