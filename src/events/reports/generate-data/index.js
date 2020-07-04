const getBaseJson = require('./_build-base-json.js')
const caseDataFields = require('@architect/shared/constants/case-data-fields.js')
const stringify = require('csv-stringify/lib/sync')
// const { createGzip } = require('zlib')
// const stream = require('stream')


/** Builds base report json data from dynamoDB data.
 *
 * Pass in params._sourcesPath to override the default sources path.
 */
async function buildBaseJson (params, updateBaseJsonStatus) {
  try {
    console.log('calling getBaseJson')
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

/** Convert array to batches.
 *
 * e.g., makeBatches([1,2,3,44], 3) => [ [ 1, 2, 3 ], [ 44 ] ]
 */
/*
function makeBatches (arr, batchSize) {
  const batches = []
  let index = 0
  while (index < arr.length)
    batches.push(arr.slice(index, index += batchSize))
  return batches
}
*/

/** Divide recs up into batches.  Accumulate the output for each
 * mapRecord in an array, and at the end of each batch write the array
 * to the stream. Include the headings in the first array.  */
/*
function batchedCsvWrite (logname, batchedRecords, headings, mapRecord, writeBatch) {
  batchedRecords.forEach((batch, bindex) => {
    console.log(`${logname}: batch ${bindex + 1} of ${batchedRecords.length}`)
    const batchContent = []
    if (bindex === 0)
      batchContent.push(stringify([ headings ]))

    batchContent.push(batch.map(mapRecord))
    writeBatch(batchContent)
  })
}
*/

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

/** timeseries.csv source.
 *
 * This code uses a promise to ensure that the writeableStream has
 * fully flushed to disk.  In prod, an older version of the code wrote
 * directly to the writeableStream, but the stream seemed to buffer
 * before writing, even though we explicitly called
 * writeableStream.end().
 */
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


/** timeseries-tidy.csv source. */
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


module.exports = {
  buildBaseJson,

  locations,
  timeseriesByLocation,

  timeseriesJhu,
  timeseriesTidy,
  timeseries
}
