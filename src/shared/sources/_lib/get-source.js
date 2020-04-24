const sourceMap = require('./source-map.js')
const sourceKey = require('./source-key.js')

/**
 * If it wasn't obvious from all the naming, this thing loads a specified source
 */
module.exports = function getSource (params) {
  let source = params
  if (params.source) source = params.source

  const sources = sourceMap()
  const filePath = sources[source]

  if (!filePath) {
    throw Error(`Specified source not found ${source}`)
  }
  try {
    // eslint-disable-next-line
    let src = require(filePath)

    // Populate the sourceKey for caching
    src._sourceKey = sourceKey(filePath)

    return src
  }
  catch (err) {
    console.error(`❌ Failed to load ${source}: \n`, err)
    throw Error(`Failed to load ${source}`)
  }
}
