const iso1Codes = require('country-levels/iso1.json')
const iso2Codes = require('country-levels/iso2.json')
const fipsCodes = require('country-levels/fips.json')
const slugify = require('slugify')
const { UNASSIGNED } = require('@architect/shared/sources/_lib/constants.js')

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

      if (level === 'iso1' && iso1Codes[id]) {
        // Location name
        locationName.push(id)
      }
      if (level === 'iso2' && iso2Codes[id]) {
        const { name } = iso2Codes[id]
        // Location name
        locationName.unshift(name)
      }
      if (level === 'fips' && fipsCodes[id]) {
        const { name } = fipsCodes[id]
        // Location name
        locationName.unshift(name)
      }
      else if (p[1] === UNASSIGNED) {
        locationName.unshift(UNASSIGNED)
      }
    }

    // Slugify / lowcase
    location.slug = slugify(locationName.join('-'), { lower: true })
    if (location.slug.startsWith(UNASSIGNED)) {
      location.slug = location.slug.replace(UNASSIGNED, 'unassigned')
    }

    location.name = locationName.join(', ')
    if (location.name.startsWith(UNASSIGNED)) {
      location.name = location.name.replace(UNASSIGNED, 'Unassigned cases')
    }

    return location
  })

  return locationNames
}
