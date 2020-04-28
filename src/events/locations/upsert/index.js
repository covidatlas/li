const arc = require('@architect/functions')

module.exports = async function upsertLocations (locations) {
  const data = await arc.tables()

  // Iterate and upsert locations
  for (const location of locations) {
    const { slug, locationID } = location
    const now = new Date().toISOString()

    // Determine whether this location exists yet
    const loc = await data.locations.get({ slug })

    // Create location if not
    if (!loc) {
      console.log(`Creating new location: ${slug} / ${locationID}`)
      location.created = now
      await data.locations.put(location)
    }
    // Update the, uh, 'updated' timestamp
    else {
      location.created = loc.created
      location.updated = now
      await data.locations.put(location)
    }
  }
}
