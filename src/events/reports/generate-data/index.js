const getBaseJson = require('./_build-base-json.js')

/** Builds base report json data from dynamoDB data.
 *
 * Pass in params._sourcesPath to override the default sources path.
 */
async function buildBaseJson (params, updateBaseJsonStatus) {
  try {
    console.log('calling getBaseJson')
    const ret = await getBaseJson(params, updateBaseJsonStatus)
    return ret
  }
  catch (err) {
    console.log(err)
    console.log(err.stack)
    throw err
  }
}

module.exports = {
  buildBaseJson
}
