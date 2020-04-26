const arc = require('@architect/functions')

module.exports = async function writeData (data) {
  const db = await arc.tables()

  let locations = []
  const now = new Date().toISOString()
  for (const item of data) {
    item.updated = now
    await db['case-data'].put(item)
    locations.push(item.locationID)
  }

  // Normalize and aggregate the locations just updated
  locations = Array.from(new Set(locations))

  return locations
}
