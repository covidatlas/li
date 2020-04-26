const arc = require('@architect/functions')
const iso2Codes = require('country-levels/iso2.json')
const fipsCodes = require('country-levels/fips.json')
const slugify = require('slugify')

module.exports = async function upsertLocations (locationIDs) {
  const db = await arc.tables()

  // Iterate and upsert locationIDs
  for (const locationID of locationIDs) {
    const now = new Date().toISOString()
    const bits = locationID.split('#')

    // Generate the human-readable slug from ISO / FIPS data
    let name = []
    for (const bit of bits) {
      const p = bit.split(':')
      const level = p[0]
      const id = p[1]

      if (level === 'iso1') name.push(id)
      if (level === 'iso2') name.unshift(iso2Codes[id.toUpperCase()].name)
      if (level === 'fips') name.unshift(fipsCodes[id].name)
    }

    // Slugify / lowcase
    name = slugify(name.join('-'), { lower: true })

    // Determine whether this location exists yet
    const location = await db.locations.get({ name })

    // Create location if not
    if (!location) {
      console.log(`Creating new location: ${name} / ${locationID}`)
      await db.locations.put({
        name,
        locationID,
        created: now
      })
    }
    // Update the, uh, 'updated' timestamp
    else {
      location.updated = now
      await db.locations.put(location)
    }
  }
}
