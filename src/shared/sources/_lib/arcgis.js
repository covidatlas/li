const assert = require('assert')

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
 * Retrieves data from an ArcGIS REST API. By default, it will
 * retrieve all items at the provided linked with geometry turned off.
 * You can control pagination size through the `featuresToFetch`
 * parameter in `options`, but this should not be necessary - by
 * default, this will make the largest request allowed by the source.
 *
 * @param {string} featureLayerURL URL of the resource, up to and
 * including the feature layer number and `query`, e.g.
 * https://services5.arcgis.com/fsYDFeRKu1hELJJs/arcgis/rest/
 *    services/FOHM_Covid_19_FME_1/FeatureServer/1/query
 *
 * @param {object} options customizable options: - featuresToFetch:
 * number of features we want to receive for each request. A smaller
 * number means more request to grab the complete dataset, a larger
 * number may result in a partial dataset if we request more than `Max
 * Record Count`. Defaults to 500.
 *
 * - additionalParams: additional parameters for this request.
 * Defaults to `where=0%3D0&outFields=*&returnGeometry=false`.
 */
async function crawlPaginated (client, featureLayerURL, options = {}) {
  const { featuresToFetch, additionalParams } = {
    featuresToFetch: undefined,
    additionalParams: 'where=0%3D0&outFields=*&returnGeometry=false',
    ...options
  }

  if (featureLayerURL.search(/\/query$/) === -1) {
    throw new Error(`Invalid URL: "${featureLayerURL}" does not end with "query"`)
  }

  let url = `${featureLayerURL.replace(/\?.*$/, '')}?f=json${additionalParams ? `&${additionalParams}` : ''}`

  // Won't get anything back without these.  Note also that if any
  // query parameters are in there twice, you get a 400 back.
  if (url.search('where=') === -1)
    url += '&where=0%3D0'
  if (url.search('outFields=') === -1)
    url += '&outFields=*'
  if (featuresToFetch)
    url += `&resultRecordCount=${featuresToFetch}`

  const result = []

  let exceededTransferLimit = true
  let n = 0
  while (exceededTransferLimit) {
    console.log(`... getting offset ${n}`)
    let { body } = await client( { url: `${url}&resultOffset=${n}` } )
    result.push(body)
    let j = JSON.parse(body)
    exceededTransferLimit = j.exceededTransferLimit
    n += j.features.length
  }

  console.log(`returning ${result.length} pages, type = ${typeof(result)}`)
  return result
}


/** Load the features from a crawlPaginated set of bodies. */
function loadPaginatedFeatures (bodies) {
  assert(Array.isArray(bodies), 'arcgis should have loaded an array')
  console.log(`Loading ${bodies.length} pages of data`)
  assert(bodies.some(b => b.features.length === 0) === false, 'All bodies have features')
  return bodies.map(b => b.features).flat()
}


module.exports = {
  urlFromOrgId,
  crawlPaginated,
  loadPaginatedFeatures
}
