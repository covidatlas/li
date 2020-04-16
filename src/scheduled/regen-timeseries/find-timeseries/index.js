const loadSources = require('@architect/shared/sources/_lib/load-sources.js')
const sourceKey = require('@architect/shared/sources/_lib/source-key.js')

module.exports = function findTimeseries () {
  let sources = loadSources()

  // Load up our source(s)
  let loaded = []
  for (const filePath of sources) {
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
