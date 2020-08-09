const querystring = require('querystring')

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


/**
 * Retrieves data from an ArcGIS REST API. By default, it will
 * retrieve all items at the provided linked with geometry turned off.
 * You can control pagination size through the `featuresToFetch`
 * parameter in `options`, but this should not be necessary - by
 * default, this will make the largest request allowed by the source.
 *
 * @param {string} featureLayerURL URL of the resource, up to and
 * including the feature layer number and `query`, e.g.
 * https://services5.arcgis.com/fsYDFeRKu1hELJJs/arcgis/rest/services/FOHM_Covid_19_FME_1/FeatureServer/1/query
 */
function paginated (featureLayerURL, options = {}) {

  const args = {
    f: 'pjson',
    where: '1=1',
    outFields: '*',
    sqlFormat: 'none',
    resultType: 'standard',
    returnIdsOnly: false,
    returnUniqueIdsOnly: false,
    returnCountOnly: false,
    returnDistinctValues: false,
    cacheHint: false,
    ...options
  }

  if (featureLayerURL.search(/\/query$/) === -1) {
    throw new Error(`Invalid URL: "${featureLayerURL}" does not end with "query"`)
  }

  function getUrl (resultOffset) {
    let useArgs = Object.assign({}, args)
    if (resultOffset)
      useArgs = Object.assign(useArgs, { resultOffset })

    // Incredibly annoying hack!  This URL is eventually passed to
    // `events/crawler/crawler/index.js`, but for some reason it
    // throws a 400 ("Crawl returned status code: 400") if the query
    // string contains a quotation mark.  Unsure why, and can't be
    // bothered to get into it.  Replacing '"' with a token here, and
    // then in `http/get-get-normal/index.js` we replace that token
    // with '"' to get the URL we want.
    useArgs = Object.keys(useArgs).reduce((hsh, k) => {
      let newVal = useArgs[k]
      if (typeof(newVal) === 'string') {
        newVal = newVal.replace(/"/g, '-QUOTE-')
      }
      hsh[k] = newVal
      return hsh
    }, {})

    let ret = `${featureLayerURL}?${querystring.stringify(useArgs)}`
    return ret
  }

  let n = 0

  return {
    first: getUrl(0),

    next: hsh => {
      const exceededTransferLimit = hsh.json.exceededTransferLimit
      console.log(`exceededTransferLimit ? ${exceededTransferLimit}`)
      if (!exceededTransferLimit) {
        console.log('reached end of pages')
        return null
      }

      n += hsh.json.features.length
      console.log(`... arcgis offset ${n}`)
      return Object.assign(hsh, { url: getUrl(n) })
    },

    records: json => {
      return json.features.map(f => f.attributes)
    }
  }
}


module.exports = {
  urlFromOrgId,
  csvUrl,
  paginated
}
