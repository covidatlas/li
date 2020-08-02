const arc = require('@architect/functions')

module.exports = async function upsertLocations (locations) {
  const data = await arc.tables()
  for (const location of locations) {
    location.updated = new Date().toISOString()
    await data.locations.put(location)
  }
}
