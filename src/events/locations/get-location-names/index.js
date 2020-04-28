const iso2Codes = require('country-levels/iso2.json')
const fipsCodes = require('country-levels/fips.json')
const slugify = require('slugify')

module.exports = function getLocationNames (locationIDs) {

  const locationNames = locationIDs.map(locationID => {
    const bits = locationID.split('#')

    let location = {
      locationID
    }

    // Construct the mostly-denormalized location object (including the human-readable slug) from ISO / FIPS data
    let locationName = []
    for (const bit of bits) {
      const p = bit.split(':')
      const level = p[0]
      const id = p[1].toUpperCase()

      if (level === 'iso1') {
        // Location name
        locationName.push(id)
      }
      if (level === 'iso2') {
        const { name } = iso2Codes[id]
        // Location name
        locationName.unshift(name)
      }
      if (level === 'fips') {
        const { name } = fipsCodes[id]
        // Location name
        locationName.unshift(name)
      }
    }

    // Slugify / lowcase
    location.slug = slugify(locationName.join('-'), { lower: true })
    location.name = locationName.join(', ')

    return location
  })

  return locationNames
}
