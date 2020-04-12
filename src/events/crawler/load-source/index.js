const loadSources = require('@architect/shared/sources/_lib/load-sources.js')
const sourceKey = require('@architect/shared/sources/_lib/source-key.js')

/**
 * Check source inclusion, based on command-line options.
 * (*) source - the source
 */
module.exports = function loadSource (params) {
  const { source } = params

  const sources = loadSources()
  const filePath = sources.find(l => l.endsWith(source))

  if (!filePath) {
    throw Error(`Specified source not found ${source}`)
  }
  // eslint-disable-next-line
  const loc = require(filePath)

  // Populate the sourceKey for caching
  loc._sourceKey = sourceKey(filePath)

  return loc
}
