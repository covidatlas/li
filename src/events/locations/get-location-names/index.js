const iso2Codes = require('country-levels/iso2.json')
const fipsCodes = require('country-levels/fips.json')
const slugify = require('slugify')

module.exports = function getLocationNames (locationIDs) {

  const locationNames = locationIDs.map(locationID => {
    const bits = locationID.split('#')

    // Get the human-readable slug from ISO / FIPS data
    let iso1
    let iso2
    let fips
    let name = []
    for (const bit of bits) {
      const p = bit.split(':')
      const level = p[0]
      let id = p[1]

      if (level === 'iso1') {
        id = id.toUpperCase()
        iso1 = id
        name.push(id)
      }
      if (level === 'iso2') {
        id = id.toUpperCase()
        iso2 = id
        name.unshift(iso2Codes[id].name)
      }
      if (level === 'fips') {
        fips = id
        name.unshift(fipsCodes[id].name)
      }
    }

    // Slugify / lowcase
    name = slugify(name.join('-'), { lower: true })

    return {
      locationID,
      name,
      iso1,
      iso2,
      fips
    }
  })

  return locationNames
}
