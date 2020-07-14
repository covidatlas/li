const getBaseJson = require('./_build-base-json.js')
const caseDataFields = require('@architect/shared/constants/case-data-fields.js')
const stringify = require('csv-stringify/lib/sync')


/** Builds base report json data from dynamoDB data.
 *
 * Pass in params._sourcesPath to override the default sources path.
 */
async function buildBaseJson (params, updateBaseJsonStatus) {
  try {
    const ret = await getBaseJson(params, updateBaseJsonStatus)
    return ret
  }
  catch (err) {
    console.log(err)
    console.log(err.stack)
    throw err
  }
}


function removeFields (rec, fields) {
  for (const f of fields)
    delete rec[f]
}


/** locations.json source. */
function locations (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  const content = baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'timeseries', 'timeseriesSources', 'warnings', 'area', 'created', 'updated', 'lat', 'long' ])
    return rec
  })
  return JSON.stringify(content, null, 2)
}

/** timeseries-byLocation.json source. */
function timeseriesByLocation (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  const content = baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'area', 'created', 'updated', 'lat', 'long' ])
    return rec
  })
  return JSON.stringify(content, null, 2)
}

/** Common fields to include in all CSV reports. */
const baseCsvColumns = [
  'locationID',
  'slug',
  'name',
  'level',
  'city',
  'countyName',
  'stateName',
  'countryName',
  'lat',
  'long',
  'population',
  'aggregate',
  'tz'
].map(s => { return { key: s, header: s.replace('Name', '') } })


function csvContent (baseJson, reduceRecord, cols) {
  return stringify(baseJson.reduce(reduceRecord, []), { columns: cols, header: true })
}


/** locations.csv source. */
function locationsCsv (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')

  const reduceRecord = (arr, rec) => {
    arr.push(rec)
    return arr
  }

  return csvContent(baseJson, reduceRecord, baseCsvColumns)
}

/** timeseries.csv source. */
function timeseries (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')

  let cols = caseDataFields.concat('date').
      reduce((a, f) => a.concat([ { key: f, header: f } ]), baseCsvColumns)

  const reduceRecord = (arr, rec) => {
    Object.keys(rec.timeseries).map(dt => {
      arr.push({ ...rec, ...rec.timeseries[dt], date: dt })
    })
    return arr
  }

  return csvContent(baseJson, reduceRecord, cols)
}

/** timeseries-jhu.csv source. */
function timeseriesJhu (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')

  const allDates = baseJson.reduce((dates, loc) => {
    return dates.concat(Object.keys(loc.timeseries))
  }, [])
  const dates = [ ...new Set(allDates) ].sort()

  let cols = dates.reduce((a, d) => {
    return a.concat([ { key: d, header: d } ])
  }, baseCsvColumns)

  const reduceRecord = (arr, rec) => {
    // Convert all 'cases' to { 'date1': count1, 'date2': count2, ... }
    const ts = rec.timeseries
    const cases = Object.keys(ts).reduce((hsh, dt) => Object.assign(hsh, { [dt]: ts[dt].cases }), {})
    arr.push(Object.assign(rec, cases))
    return arr
  }

  return csvContent(baseJson, reduceRecord, cols)
}


/**
 // Disabling this report, it always crashes.
// timeseries-tidy.csv source.
function timeseriesTidy (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')

  let cols = [ 'date', 'type', 'value' ].reduce((a, s) => {
    return a.concat([ { key: s, header: s } ])
  }, baseCsvColumns)

  const reduceRecord = (arr, rec) => {
    Object.keys(rec.timeseries).forEach(dt => {
      Object.keys(rec.timeseries[dt]).forEach(k => {
        const r = { ...rec, date: dt, type: k, value: rec.timeseries[dt][k] }
        arr.push(r)
      })
    })
    return arr
  }

  return csvContent(baseJson, reduceRecord, cols)
}
*/


/** timeseries-tidy-small.csv source. */
function timeseriesTidySmall (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')

  let cols = [ 'locationID', 'date', 'type', 'value' ].reduce((a, s) => {
    return a.concat([ { key: s, header: s } ])
  }, [])

  const reduceRecord = (arr, rec) => {
    Object.keys(rec.timeseries).forEach(dt => {
      Object.keys(rec.timeseries[dt]).forEach(k => {
        const r = { locationID: rec.locationID, date: dt, type: k, value: rec.timeseries[dt][k] }
        arr.push(r)
      })
    })
    return arr
  }

  return csvContent(baseJson, reduceRecord, cols)
}


module.exports = {
  buildBaseJson,

  locations,
  timeseriesByLocation,

  locationsCsv,
  timeseriesJhu,
  timeseriesTidySmall,
  timeseries
}
