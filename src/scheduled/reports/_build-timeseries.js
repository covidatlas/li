/** Case data fields to include in reports. */
// TODO (data) validate the fields that we want to include
// TODO (data) extract these fields as a common constant, and use everywhere
const reportFields = [
  'cases',
  'deaths',
  'hospitalized',
  'icu',
  'recovered',
  'tested',
]

/** Determines final value for a given field in a set of records.
 *
 * The value to use is determined by source priority.  If multiple
 * sources have the same highest priority, then (arbitrarily) the
 * largest value for that field in the highest-priority sources is
 * used, and a warning is included in the return value. */
function valueAndWarningForField (sortedRecords, f) {
  const haveVals = sortedRecords.filter(r => r[f] !== undefined && r[f] !== null)
  if (haveVals.length === 0)
    return { value: undefined }
  const maxPriority = Math.max(...haveVals.map(r => r.priority))

  const bySource = (a, b) => (a.source < b.name ? -1 : 1)
  const candidates = haveVals.
        filter(r => r.priority === maxPriority).
        sort(bySource)

  if (candidates.length === 1)
    return { value: candidates[0][f], source: candidates[0].source }

  // Multiple equal priority.
  const values = candidates.map(c => c[f])
  const max = Math.max(...values)
  const min = Math.min(...values)
  const maxSource = candidates.find(c => c[f] === max).source

  const result = {
    value: max,
    source: maxSource
  }

  if (max !== min) {
    const conflicts = candidates.map(c => `${c.source}: ${c[f]}`).join(', ')
    result.warning = `conflict (${conflicts})`
  }
  return result
}

/** Create a combined value from all sources, using the source
 * priority to determine which value to use for each field. */
function combinedRecord (records) {
  // Multiple sources of different priorities can return data.  Sort
  // the highest to the last, because later records "win" when
  // combining sources.
  const sortedRecords = records.
        map(r => { r.priority = r.priority || 0; return r }).
        sort((a, b) => a.priority - b.priority)

  // Only look at the fields that exist in any of the records.
  const base = records.reduce((h, rec) => Object.assign(h, rec), {})

  return Object.keys(base).
    filter(f => reportFields.includes(f)).
    reduce((hsh, f) => {
      const vw = valueAndWarningForField(sortedRecords, f)
      if (vw.value === null || vw.value === undefined)
        return hsh

      hsh.data[f] = vw.value
      hsh.sources[f] = vw.source

      if (vw.warning)
        hsh.warnings[f] = vw.warning
      return hsh
    }, { data: {}, warnings: {}, sources: {} })
}

/** Reduce the 'sources' data for a given location/date record.  If
 * all fields are from a single source, only show that source;
 * otherwise, return a hash map of sources to the fields. */
function reduceSources (fieldSourceHash) {
  const sources = [ ...new Set(Object.values(fieldSourceHash)) ]
  if (sources.length === 1)
    return sources[0]
  const pairs = Object.entries(fieldSourceHash)
  return sources.sort().reduce((hsh, src) => {
    const fields = pairs.filter(p => p[1] === src).map(p => p[0]).sort()
    hsh[src] = fields
    return hsh
  }, {})
}

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

/** Get timeseries and any warnings for a locationID using the set of
 * records. */
function locationDetails (locationID, records) {
  const locRecords = records.filter(rec => rec.locationID === locationID)
  const dates = [ ...new Set(locRecords.map(rec => rec.date)) ]

  const result = dates.reduce((hsh, d) => {
    const atDate = locRecords.filter(lr => lr.date === d)
    const combined = combinedRecord(atDate)
    hsh.timeseries[d] = combined.data
    hsh.sources[d] = reduceSources(combined.sources)

    if (Object.keys(combined.warnings).length !== 0)
      hsh.warnings[d] = combined.warnings

    return hsh
  }, { timeseries: {}, sources: {}, warnings: {} })

  result.sources = collapseSourceDates(result.sources)

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
