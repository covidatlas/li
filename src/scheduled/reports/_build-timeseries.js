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
      if (vw.value !== null && vw.value !== undefined)
        hsh.data[f] = vw.value
      if (vw.warning)
        hsh.warnings[f] = vw.warning
      return hsh
    }, { data: {}, warnings: {} })
}

/** Get timeseries and any warnings for a locationID using the set of
 * records. */
function timeseriesAndWarningsForLocation (locationID, records) {
  const locRecords = records.filter(rec => rec.locationID === locationID)
  const dates = [ ...new Set(locRecords.map(rec => rec.date)) ]
  return dates.reduce((hsh, d) => {
    const atDate = locRecords.filter(lr => lr.date === d)
    const combined = combinedRecord(atDate)
    hsh.timeseries[d] = combined.data

    if (Object.keys(combined.warnings).length !== 0)
      hsh.warnings[d] = combined.warnings

    return hsh
  }, { timeseries: {}, warnings: {} })
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
  return locationIDs.map(locationID => {
    const tw = timeseriesAndWarningsForLocation(locationID, records)
    const result = {
      locationID,
      timeseries: tw.timeseries
    }
    if (Object.keys(tw.warnings).length !== 0)
      result.warnings = tw.warnings

    return result
  })
}

module.exports = buildTimeseries
