const sourceMap = require('@architect/shared/sources/_lib/source-map.js')
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

    loaded.push(src)
  }

  // Only load timeseries; ignore retired sources
  const timeseries = loaded.filter(s => s.timeseries && !s.endDate)
  if (!timeseries.length) {
    throw Error('No timeseries sources found')
  }

  return timeseries
}
