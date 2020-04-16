const { sep } = require('path')
const loadSources = require('@architect/shared/sources/_lib/load-sources.js')
const sourceKey = require('@architect/shared/sources/_lib/source-key.js')

module.exports = function findTimeseries (params) {
  const { source } = params

  let sources = loadSources()

  // A specific source was requested, so first make sure it exists
  if (source) {
    const filePath = sources.find(l => l.endsWith(source))
    if (!filePath) {
      throw Error(`Specified source not found: ${source}`)
    }
    else sources = [filePath]
  }

  // Load up our source(s)
  let loaded = []
  for (const filePath of sources) {
    // eslint-disable-next-line
    const src = require(filePath)

    // Populate the sourceKey for caching
    src._sourceKey = sourceKey(filePath)

    // Use this later to invoke other events
    src.source = filePath.split(`shared${sep}sources`)[1].substr(1)

    loaded.push(src)
  }

  // Only load timeseries; ignore retired sources
  const timeseries = loaded.filter(s => s.timeseries && !s.endDate)
  if (!timeseries.length) {
    if (source) {
      throw Error(`Specified source is not timeseries: ${source}`)
    }
    throw Error('No timeseries sources found')
  }

  return timeseries
}
