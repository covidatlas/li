const createMultivalentRecord = require('./_multivalent-record.js')

/** Creates full list of locationIDs and levels from those implied in
 * locationIDs.
 *
 * e.g., iso1:us#iso2:us-ca#fips:06007 implies 3 ids:
 *
 * level   id
 * -----   --
 *   3     iso1:us#iso2:us-ca#fips:06007
 *   2     iso1:us#iso2:us-ca
 *   1     iso1:us
 */
function allLocationsAndLevels (locationIDs) {
  const idLevels = locationIDs.
        map(id => {
          // Convert 'a#b#c' to [ 'a', 'a#b', 'a#b#c' ]
          const parts = id.split('#')
          return [ ...Array(parts.length).keys() ].
            map(index => parts.slice(0, index + 1).join('#'))
        }).
        flat().
        reduce((hsh, id) => {
          // Create id-to-level map ('a': 1, 'a#b': 2, 'a#b#c': 3)
          hsh[ id ] = id.split('#').length + 1
          return hsh
        }, {})

  return Object.entries(idLevels).map(pair => {
    return { level: pair[1], locationID: pair[0] }
  })
}


function sumChildRecords (children, date) {
  const allFields = children.map(c => Object.keys(c.timeseries[date])).flat()
  const fields = [ ...new Set(allFields) ]
  const seed = fields.reduce((hsh, f) => Object.assign(hsh, { [f]: 0 }), {})
  return children.reduce((hsh, c) => {
    const childRec = c.timeseries[date]
    for (const [ f, v ] of Object.entries(childRec))
      hsh[f] += v
    return hsh
  }, seed)
}


// TODO switch args 2 and 3
function rollup (timeseries, levelsAndIds, locationID, level) {

  // Build on existing timeseries entry for locationID, if any.
  const empty = {
    timeseries: {},
    timeseriesSources: {},
    sources: []
  }
  const result = Object.assign(empty, timeseries[locationID])

  const children = levelsAndIds.
        filter(lid =>
               lid.level === (level + 1) &&
               lid.locationID.startsWith(locationID)).
        map(lid => timeseries[lid.locationID])

  // TODO: keep parent value if present
  // TODO: set missing parent value to sum of children value, and set source and timeseriesSource to rollup.
  // TODO: "reduceSources" needs to occur after this step, b/c this step may add 'rollup' as the source for some fields.
  const cDates = children.map(c => Object.keys(c.timeseries)).flat()
  const dates = [ ...new Set(cDates) ].sort()
  for (const d of dates) {
    const parentRecord = result.timeseries[d] || {}
    parentRecord.priority = 1
    parentRecord.date = d
    parentRecord.locationID = locationID

    let rollup = sumChildRecords(children, d)
    rollup = Object.assign(rollup, { locationID, date: d, source: 'rollup', priority: 0 })

    // TODO (reporting) account for warnings in parent/child rollups.
    const {
      data, /* warnings, */ timeseriesSources, sources
    } = createMultivalentRecord([ parentRecord, rollup ])

    result.timeseries[d] = data
    result.timeseriesSources[d] = timeseriesSources
    result.sources = result.sources.concat(sources)
  }

  return result
}

/** Add rollups for locations in timeseries.
 *
 * a) Get the implied locations and levels from locationIDs in
 * timeseries.
 *
 * e.g, if timeseries has locationID a#b#c, the tree is as follows:
 *
 * level   locationID
 *   1       a
 *   2       b
 *   3       c
 *
 * b) Starting at tree depth - 1 (e.g., level L = 2 above), for each
 * location loc at that level:
 *
 *    b0) add a new node to the rollup, if loc doesn't exist
 *    b1) get all locations at level L + 1 rolling up to loc
 *    b2) do rollup for each date
 *
 * next location
 *
 * decrement level, and repeat.
 */
function addRollups (timeseries) {

  const levelsAndIds = allLocationsAndLevels(Object.keys(timeseries))
  const levels = [ ...new Set(levelsAndIds.map(l => l.level)) ]
  const maxLevel = Math.max(...levels)
  for (let level = maxLevel - 1; level > 0; level--) {
    const locsAtLevel = levelsAndIds.
          filter(i => i.level === level).
          map(i => i.locationID)
    for (const locationID of locsAtLevel) {
      timeseries[locationID] = rollup(timeseries, levelsAndIds, locationID, level)
    }
  }

  return timeseries
}

module.exports = addRollups
