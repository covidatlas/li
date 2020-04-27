const arc = require('@architect/functions')

module.exports = async function writeData (data) {
  const db = await arc.tables()

  let locationIDs = []
  const now = new Date().toISOString()
  for (const item of data) {
    item.updated = now
    await db['case-data'].put(item)
    locationIDs.push(item.locationID)
  }

  // Normalize and aggregate the locationIDs just updated
  locationIDs = Array.from(new Set(locationIDs))

  return locationIDs
}
