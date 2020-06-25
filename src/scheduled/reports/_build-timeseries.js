const createMultivalentRecord = require('./_multivalent-record.js')


/** Collapse same source dates to string ranges.
 *
 * The generated timeseries for a given location contains 'sources'
 * for each date
 * (e.g. `"sources":{"2020-06-19":"src1","2020-06-20":"src1", ...}`.
 *
 * Since most sources for a given timeseries will likely stay constant
 * over long periods of time, this will become tiresome.  We can
 * compress this to the following:
 *
 * "sources":{"2020-06-19..2020-06-25":"src1"}
 */
function collapseSourceDates (dateSourceHash) {
  const entries = Object.entries(dateSourceHash)
  const e = entries[0]
  let currRec = { firstDate: e[0], lastDate: e[0], sources: e[1] }

  const arr = []
  arr.push(currRec)
  entries.forEach(p => {
    const [ dt, sources ] = p
    if (JSON.stringify(currRec.sources) === JSON.stringify(sources))
      currRec.lastDate = dt
    else {
      currRec = { firstDate: dt, lastDate: dt, sources: sources }
      arr.push(currRec)
    }
  })

  const dateRangeString = (a, b) => (a === b) ? a : `${a}..${b}`
  return arr.map(a => {
    return { [dateRangeString(a.firstDate, a.lastDate)]: a.sources }
  }).reduce((hsh, v) => Object.assign(hsh, v), {})

}


/** Add growth factor to all dates for the location. */
function addGrowthFactor (ts, dates) {
  function casesAt (dt) {
    if (ts[dt] === undefined) return null
    if ((ts[dt].cases || 0) === 0) return null
    return ts[dt].cases
  }

  for (var i = 1; i < dates.length; i++) {
    const curr = casesAt(dates[i])
    const prev = casesAt(dates[i - 1])
    if (curr && prev) {
      ts[dates[i]].growthFactor = Math.round((curr/prev + Number.EPSILON) * 100) / 100
    }
  }
}

/** Get timeseries and any warnings for a locationID using the set of
 * records. */
function locationDetails (locationID, records) {
  const locRecords = records.filter(rec => rec.locationID === locationID)
  const dates = [ ...new Set(locRecords.map(rec => rec.date)) ].sort()

  const result = dates.reduce((hsh, d) => {
    const atDate = locRecords.filter(lr => lr.date === d)
    const combined = createMultivalentRecord(atDate)

    hsh.timeseries[d] = combined.data
    hsh.timeseriesSources[d] = combined.timeseriesSources
    hsh.sources = hsh.sources.concat(combined.sources)

    if (Object.keys(combined.warnings).length !== 0)
      hsh.warnings[d] = combined.warnings

    return hsh
  }, { timeseries: {}, timeseriesSources: {}, sources: [], warnings: {} })

  addGrowthFactor(result.timeseries, dates)

  result.timeseriesSources = collapseSourceDates(result.timeseriesSources)
  result.sources = [ ...new Set(result.sources) ].sort()

  if (Object.keys(result.warnings).length === 0)
    delete result.warnings

  return result
}

/** Each record must have a minumum set of fields. */
function validateRecords (records) {

  const minimalRecordSample = {
    locationID: 'someID',
    date: '2020-06-19',
    source: 'someName'
    // priority and case data are optional!
  }
  const requiredKeys = Object.keys(minimalRecordSample)

  function missingRequiredKeys (rec) {
    const keys = Object.keys(rec)
    return requiredKeys.some(f => !keys.includes(f))
  }
  const badRecords = records.filter(missingRequiredKeys)

  if (badRecords.length > 0) {
    const ex = JSON.stringify(badRecords[0])
    const msg = `${badRecords.length} records missing one or more fields ${requiredKeys.join(', ')} (e.g. ${ex})`
    throw new Error(msg)
  }
}

/** Build timeseries for each location and date in records. */
function buildTimeseries (records) {
  validateRecords (records)
  const locationIDs = [ ...new Set(records.map(r => r.locationID)) ].sort()
  return locationIDs.
    map(lid => { return { [lid]: locationDetails(lid, records) } }).
    reduce((result, hsh) => Object.assign(result, hsh), {})
}

module.exports = buildTimeseries
