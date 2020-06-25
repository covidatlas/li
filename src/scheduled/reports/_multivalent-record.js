/** Multivalent records.
 *
 * A "multivalent record" is one which combines data dimensions from
 * multiple sources to yield a final combined data item.  For example,
 * if location L has death data D from source Ld and case data C from
 * Lc, those can be combined:
 *
 * L = { cases: C, deaths: D }
 *
 * Since multiple sources can potentially give the same data
 * dimension, we need to determine the final value that the
 * multivalent record should contain.  We use the source "priority" to
 * determine the final value, and report on conflicts.
 */

const assert = require('assert')

/** Case data fields to include in reports. */
const reportFields = require('@architect/shared/constants/case-data-fields.js')

/** Determines final value for a given field in a set of records.
 *
 * The value to use is determined by source priority.  If multiple
 * sources have the same highest priority, then (arbitrarily) the
 * largest value for that field in the highest-priority sources is
 * used, and a warning is included in the return value. */
function multivalentField (sortedRecords, f) {
  const haveVals = sortedRecords.filter(r => r[f] !== undefined && r[f] !== null)
  if (haveVals.length === 0)
    return { value: undefined }
  const maxPriority = Math.max(...haveVals.map(r => r.priority || 0))

  const candidates = haveVals.
        filter(r => (r.priority || 0) === maxPriority)

  if (candidates.length === 1)
    return { value: candidates[0][f], source: candidates[0].source }

  // Multiple equal priority.
  const values = candidates.map(c => c[f])
  const max = Math.max(...values)
  const min = Math.min(...values)

  // Arbitrarily picking the first source with the max value as the
  // source used.
  const bySource = (a, b) => (a.source < b.name ? -1 : 1)
  const maxSource = candidates.sort(bySource).
        find(c => c[f] === max).source

  // Arbitrarily using the maximum value returned by any sources.
  const result = {
    value: max,
    source: maxSource
  }

  if (min !== max) {
    const conflicts = candidates.map(c => `${c.source}: ${c[f]}`)
    result.warning = `conflict (${conflicts.join(', ')})`
  }
  return result
}

/** Reduce the 'sources' data.  If all fields are from a single
 * source, only show that source; otherwise, return a hash map of
 * sources to the fields. */
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


function assertAllSame (records, field) {
  const vals = [ ...new Set(records.map(r => r[field])) ]
  assert.equal(vals.length, 1, `multivalent record can only be created from records with same ${field}`)
}

/** Create a combined value from all sources, using the source
 * priority to determine which value to use for each field. */
function createMultivalentRecord (records) {

  const emptyRecord = { data: {}, warnings: {}, timeseriesSources: {}, sources: [] }
  if (records.length === 0)
    return emptyRecord

  assertAllSame(records, 'date')
  assertAllSame(records, 'locationID')

  // Multiple sources of different priorities can return data.  Sort
  // the highest to the last, because later records "win" when
  // combining sources.
  const nz = n => n || 0
  const sorted = records.sort((a, b) => nz(a.priority) - nz(b.priority))

  const accumAllFields = (a, rec) => a.concat(Object.keys(rec))
  const uniques = (arr, v) => arr.includes(v) ? arr : arr.concat(v)
  let fields = records.reduce(accumAllFields, []).
      reduce(uniques, []).
      filter(f => reportFields.includes(f)).
      map(f => { return { field: f, ...multivalentField(sorted, f) } }).
      filter(f => f.value !== null && f.value !== undefined)

  const result = fields.reduce((hsh, f) => {
    const { field, value, source, warning } = f
    hsh.data[field] = value
    hsh.timeseriesSources[field] = source
    hsh.sources.push(source)
    if (warning)
      hsh.warnings[field] = warning
    return hsh
  }, emptyRecord)

  result.timeseriesSources = reduceSources(result.timeseriesSources)
  result.sources = [ ...new Set(result.sources) ].sort()
  return result
}


module.exports = createMultivalentRecord
