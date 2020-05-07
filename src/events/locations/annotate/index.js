const iso1Codes = require('country-levels/iso1.json')
const iso2Codes = require('country-levels/iso2.json')
const fipsCodes = require('country-levels/fips.json')

/**
 * Annotate a location with data at the smallest regional level available
 */
module.exports = function annotateLocations (locations) {

  const annotatedLocations = locations.map(location => {
    const { locationID } = location
    const bits = locationID.split('#')

    function add (key, value) {
      if (value) location[key] = value
    }

    for (const bit of bits) {
      const p = bit.split(':')
      const level = p[0]
      const id = p[1].toUpperCase()

      if (level === 'iso1') {
        const {
          area_m2,
          center_lon,
          center_lat,
          countrylevel_id,
          name,
          population,
          timezone
        } = iso1Codes[id]

        // Geo
        if (area_m2) location.area = { squareMeters: area_m2 }
        if (center_lon && center_lat) location.coordinates = [ center_lon, center_lat ]

        // Other data
        add('countryID', countrylevel_id)
        add('countryName', name)
        add('population', population)
        add('tz', timezone)
        add('level', 'country')
      }
      if (level === 'iso2') {
        const {
          area_m2,
          center_lon,
          center_lat,
          countrylevel_id,
          name,
          population,
          timezone
        } = iso2Codes[id]

        // Geo
        if (area_m2) location.area = { squareMeters: area_m2 }
        if (center_lon && center_lat) location.coordinates = [ center_lon, center_lat ]

        // Other data
        add('stateID', countrylevel_id)
        add('stateName', name)
        add('population', population)
        add('tz', timezone)
        add('level', 'state')
      }
      if (level === 'fips') {
        const {
          area_m2,
          census_data,
          center_lon,
          center_lat,
          countrylevel_id,
          name,
          population,
          timezone
        } = fipsCodes[id]

        // Geo
        let area = {}
        if (area_m2) area.squareMeters = area_m2
        if (census_data) {
          const { ALAND, AWATER } = census_data
          if (ALAND) area.landSquareMeters = ALAND
          if (AWATER) area.waterSquareMeters = AWATER
        }
        if (Object.keys(area).length) {
          location.area = area
        }
        if (center_lon && center_lat) location.coordinates = [ center_lon, center_lat ]

        // Other data
        add('countyID', countrylevel_id)
        add('countyName', name)
        add('population', population)
        add('tz', timezone)
        add('level', 'county')
      }
    }

    return location
  })

  return annotatedLocations
}
