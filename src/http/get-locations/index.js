const arc = require('@architect/functions')

/**
 * Returns an array of locations currently in the system
 */
async function getLocations () {
  const data = await arc.tables()
  const result = await data.locations.scan({})
  const locations = result.Items.map(i => i.slug)
  return {
    json: locations,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
    }
  }
}

exports.handler = arc.http.async(getLocations)
