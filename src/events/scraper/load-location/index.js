const loadLocations = require('@architect/shared/locations/_lib/load-locations.js')
const locationKey = require('@architect/shared/locations/_lib/location-key.js')

/**
 * Check location inclusion, based on command-line options.
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
    const loc = require(filePath)

    // Populate the locationKey for caching
    loc._locationKey = locationKey(filePath)

    return loc
  }
  catch (err) {
    throw Error(`Location could not be loaded ${location}`)
  }
}
