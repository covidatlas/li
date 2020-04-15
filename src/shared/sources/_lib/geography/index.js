const usStates = require('./us-states.json')

/**
 * Append ' County' to the end of a string, if not already present
 */
function addCounty (county, suffix = 'County') {
  const norm = str => str.replace(/ /g, '').toLowerCase()
  if (!norm(county).endsWith(norm(suffix))) {
    return county += ` ${suffix}`
  }
  return county
}

/**
 * Add empty regions if they're not defined already;
 * Backfill counties that are named but do not have case data
 */
function addEmptyRegions (regionDataArray, regionNameArray, regionGranularity) {
  if (regionDataArray.length === 0) {
    throw new Error(`Attempted to addEmptyRegions with without providing any ${regionGranularity} records`)
  }
  let cases = 0
  for (const entry of regionDataArray) {
    if (entry.cases !== undefined) {
      cases += entry.cases
    }
  }
  if (cases === 0) {
    throw new Error(`Attempted to addEmptyRegions with without providing any actual cases`)
  }

  // Get an object of all the tracked regions
  const trackedRegions = regionDataArray.reduce((a, region) => {
    a[region[regionGranularity]] = true
    return a
  }, {})

  for (const regionName of regionNameArray) {
    if (!trackedRegions[regionName]) {
      // Throw an empty region on if not defined
      regionDataArray.push({
        [regionGranularity]: regionName,
        cases: 0
      })
    }
  }
  return regionDataArray
}

/**
 * Get a proper state name
 */
function getState (state) {
  return usStates[state] || state
}

module.exports = {
  addCounty,
  addEmptyRegions,
  getState
}
