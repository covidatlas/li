// TODO impl FIPS lookups

module.exports = function normalizeData (source, output, date) {

  const data = output.map(location => {
    const { country, state, county } = location

    // Backfill missing source locale data
    if (!country && source.country) location.country = source.country
    if (!state && source.state) location.state = source.state
    if (!county && source.county) location.county = source.county

    // Generate primary key ('location')
    let key = location.country
    if (location.state) key += `#${location.state}`
    if (location.county) key += `#${location.county}`
    key = key.toLowerCase()

    // Add secondary keys
    return Object.assign(location, {
      location: key,
      date: date,
      source: source._sourceKey,
      priority: source.priority || 0 // Backfill to 0 for sorting later
    })
  })

  return data
}
