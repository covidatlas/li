const normalizeUS = require('./_normalize-us.js')

module.exports = function normalizeData (source, output, date) {

  // '#' is reserved for compound key generation, ensure it didn't somehow leak in
  function validate (str) {
    if (str.includes('#')) throw Error(`Invalid key data (cannot include #!): ${str}`)
  }

  const data = output.map(location => {
    const { country, state, county } = location

    // Backfill missing source locale data
    if (!country && source.country) location.country = source.country
    if (!state && source.state) location.state = source.state
    if (!county && source.county) location.county = source.county

    // Maybe normalize US state and county entities
    location = normalizeUS(location)

    // Generate primary locationID ('location')
    let id = location.country
    validate(id)

    // Append state (if available)
    if (location.state) {
      validate(location.state)
      id += `#${location.state}`
    }

    // Append county (if available)
    if (location.county) {
      validate(location.county)
      id += `#${location.county}`
    }

    // Normalize
    const locationID = id.toLowerCase()

    // Add secondary keys
    return Object.assign(location, {
      locationID,
      date,
      source: source._sourceKey,
      priority: source.priority || 0 // Backfill to 0 for sorting later
    })
  })

  return data
}
