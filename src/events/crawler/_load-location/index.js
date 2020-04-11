const loadLocations = require('@architect/shared/locations/_lib/load-locations.js')

/**
 * Check location inclusion, based on command-line options.
 * (*) location - the location
 */
module.exports = function loadLocation (params) {
  const { location } = params

  const locations = loadLocations()
  const filePath = locations.find(l => l.endsWith(location))

  if (!filePath) {
    throw Error(`Specified location not found ${location}`)
  }
  try {
    // eslint-disable-next-line
    return require(filePath)
  }
  catch (err) {
    throw Error(`Location could not be loaded ${location}`)
  }
}
