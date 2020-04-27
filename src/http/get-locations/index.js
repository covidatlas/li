const arc = require('@architect/functions')

/**
 * Returns an array of locations currently in the system
 */
async function getLocations () {
  const data = await arc.tables()
  const result = await data.locations.scan({})
  const locations = result.Items.map(i => i.name)
  return { json: locations }
}

exports.handler = arc.http.async(getLocations)
