const arc = require('@architect/functions')

module.exports = async function upsertLocations (locations) {
  const db = await arc.tables()

  // Iterate and upsert locations
  for (const location of locations) {
    const { name, locationID } = location
    const now = new Date().toISOString()

    // Determine whether this location exists yet
    const loc = await db.locations.get({ name })

    // Create location if not
    if (!loc) {
      console.log(`Creating new location: ${name} / ${locationID}`)
      location.created = now
      await db.locations.put(location)
    }
    // Update the, uh, 'updated' timestamp
    else {
      location.created = loc.created
      location.updated = now
      await db.locations.put(location)
    }
  }
}
