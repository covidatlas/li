// eslint-disable-next-line
const sourceMap = require('@architect/shared/sources/_lib/source-map.js')
// eslint-disable-next-line
const sourceKey = require('@architect/shared/sources/_lib/source-key.js')

module.exports = function findTimeseries () {
  let sources = sourceMap()
  const filePaths = Object.values(sources)

  // Load up our source(s)
  let loaded = []
  for (const filePath of filePaths) {
    // eslint-disable-next-line
    const src = require(filePath)

    // Populate the sourceKey for caching
    src._sourceKey = sourceKey(filePath)

    if (!src.endDate) {
      loaded.push(src)
    }
  }

  return loaded
}
