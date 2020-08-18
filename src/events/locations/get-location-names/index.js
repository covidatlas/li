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

    // Construct the mostly-denormalized location object (including
    // the human-readable slug) from ISO / FIPS data
    let locationName = []
    let locationSlug = []
    for (const bit of bits) {

      // Some locations report some data as UNASSIGNED for the state
      // or county.  In these cases, the UNASSIGNED part doesn't have
      // an associated iso2 or fips code, e.g.
      //
      // * iso1:us#iso2:us-fl#(unassigned)
      // * iso1:us#iso2:us-ga#(unassigned)
      //
      // We may have unassigned states as well:
      //
      // * iso1:XX#(unassigned)

      let level = ''
      let id = bit

      if (bit.includes(':')) {
        const p = bit.split(':')
        level = p[0]
        id = p[1].toUpperCase()
      }

      if (level === 'iso1' && iso1Codes[id]) {
        const { name } = iso1Codes[id]
        locationName.push(name)
        locationSlug.push(id)
      }
      if (level === 'iso2' && iso2Codes[id]) {
        const { name } = iso2Codes[id]
        locationName.unshift(name)
        locationSlug.unshift(name)
      }
      if (level === 'fips' && fipsCodes[id]) {
        const { name } = fipsCodes[id]
        locationName.unshift(name)
        locationSlug.unshift(name)
      }
      else if (id === UNASSIGNED) {
        locationName.unshift(UNASSIGNED)
        locationSlug.unshift(UNASSIGNED)
      }
    }

    // Slugify / lowcase
    location.slug = slugify(locationSlug.join('-'), { lower: true })
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
