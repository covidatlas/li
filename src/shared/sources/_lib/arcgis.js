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
  let { body } = await client( { url } )
  body = JSON.parse(`[${body}]`)
  const { serviceItemId } = body[0]
  let ret = `https://opendata.arcgis.com/datasets/${serviceItemId}_0.csv`
  console.log(`Calling ${ret}`)
  return ret
}

/**
 * Get the URL for the CSV data from an ArcGIS dashboard
 *
 * @param {*} client the client object
 * @param {*} serverNumber the servern number, find this by looking at requests (i.e. https://services1.arcgis.com/ is serverNumber = 1)
 * @param {*} dashboardId the ID of the dashboard, as passed to the iframe that renders it (i.e. https://maps.arcgis.com/apps/opsdashboard/index.html#/ec4bffd48f7e495182226eee7962b422 is dashboardId = ec4bffd48f7e495182226eee7962b422)
 * @param {*} layerName the name of the layer to fetch data for, find this by examining requests
 */
async function csvUrl (client, serverNumber, dashboardId, layerName) {
  const dashboardUrl = `https://maps.arcgis.com/sharing/rest/content/items/${dashboardId}?f=json`
  let { body } = await client( { url: dashboardUrl } )
  const { orgId } = JSON.parse(body)
  return urlFromOrgId(client, serverNumber, orgId, layerName)
}

module.exports = {
  urlFromOrgId,
  csvUrl
}
