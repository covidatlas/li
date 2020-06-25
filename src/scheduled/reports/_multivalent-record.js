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


/** Create a combined value from all sources, using the source
 * priority to determine which value to use for each field. */
function createMultivalentRecord (records) {
  // Multiple sources of different priorities can return data.  Sort
  // the highest to the last, because later records "win" when
  // combining sources.
  const sortedRecords = records.
        map(r => { r.priority = r.priority || 0; return r }).
        sort((a, b) => a.priority - b.priority)

  // Only look at the fields that exist in any of the records.
  const base = records.reduce((h, rec) => Object.assign(h, rec), {})

  const result = Object.keys(base).
    filter(f => reportFields.includes(f)).
    reduce((hsh, f) => {
      const { value, source, warning } = multivalentField(sortedRecords, f)
      if (value === null || value === undefined)
        return hsh

      hsh.data[f] = value
      hsh.timeseriesSources[f] = source
      hsh.sources.push(source)

      if (warning)
        hsh.warnings[f] = warning
      return hsh
    }, { data: {}, warnings: {}, timeseriesSources: {}, sources: [] })

  result.timeseriesSources = reduceSources(result.timeseriesSources)
  result.sources = [ ...new Set(result.sources) ]
  return result
}


module.exports = createMultivalentRecord
