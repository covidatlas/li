const iso1Codes = require('country-levels/iso1.json')
const iso2Codes = require('country-levels/iso2.json')
const fipsCodes = require('country-levels/fips.json')

/**
 * Annotate a location with data at the smallest regional level available
 */
module.exports = function annotate (locationNames) {

  // TODO add hospital beds + other data points
  const locations = locationNames.map(loc => {
    const { fips, iso2, iso1, name, locationID } = loc
    let location = { name, locationID }
    if (fips) {
      const { center_lat, center_lon, population } = fipsCodes[fips]
      if (center_lat) location.centerLat = center_lat
      if (center_lon) location.centerLong = center_lon
      if (population) location.population = population
      return location
    }
    if (iso2) {
      const { center_lat, center_lon, population } = iso2Codes[iso2]
      if (center_lat) location.centerLat = center_lat
      if (center_lon) location.centerLong = center_lon
      if (population) location.population = population
      return location
    }
    if (iso1) {
      const { center_lat, center_lon, population } = iso1Codes[iso1]
      if (center_lat) location.centerLat = center_lat
      if (center_lon) location.centerLong = center_lon
      if (population) location.population = population
      return location
    }
  })

  return locations
}
