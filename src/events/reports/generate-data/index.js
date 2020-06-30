const getBaseJson = require('./_build-base-json.js')
const caseDataFields = require('@architect/shared/constants/case-data-fields.js')
const stringify = require('csv-stringify/lib/sync')

function removeFields (rec, fields) {
  for (const f of fields)
    delete rec[f]
}


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

/** locations.json source. */
function locations (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'timeseries', 'timeseriesSources', 'warnings', 'area', 'created', 'updated' ])
    return rec
  })
}

/** timeseries-byLocation.json source. */
function timeseriesByLocation (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'area', 'created', 'updated' ])
    return rec
  })
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


function baseCsv (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  return baseJson.map(loc => {
    let rec = Object.assign({}, loc)
    rec.lat = rec.coordinates[1]
    rec['long'] = rec.coordinates[0]
    return rec
  })
}

/** timeseries.csv source.
 *
 */
function timeseries (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  const data = []
  baseCsv(baseJson).forEach(rec => {
    Object.keys(rec.timeseries).forEach(dt => {
      data.push({
        ...rec,
        ...rec.timeseries[dt],
        date: dt,
      })
    })
  })

  let cols = caseDataFields.concat('date').
      reduce((a, f) => a.concat([ { key: f, header: f } ]), baseCsvColumns)
  return stringify( data, { header: true, columns: cols })
}

/** timeseries-jhu.csv source.
 *
 */
function timeseriesJhu (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  const allDates = baseJson.reduce((dates, loc) => {
    return dates.concat(Object.keys(loc.timeseries))
  }, [])
  const dates = [ ...new Set(allDates) ].sort()

  const data = baseCsv(baseJson).map(rec => {
    const caseTs = Object.entries(rec.timeseries).
      reduce((hsh, e) => Object.assign(hsh, { [e[0]]: e[1].cases }), {})
    return Object.assign(rec, caseTs)
  })

  let cols = dates.reduce((a, d) => {
    return a.concat([ { key: d, header: d } ])
  }, baseCsvColumns)
  return stringify( data, { header: true, columns: cols })
}


/** timeseries-tidy.csv source.
 *
 */
function timeseriesTidy (baseJson) {
  if (!baseJson) throw new Error('baseJson data is required')
  const data = []
  baseCsv(baseJson).forEach(rec => {
    Object.keys(rec.timeseries).forEach(dt => {
      Object.keys(rec.timeseries[dt]).forEach(k => {
        data.push({
          ...rec,
          date: dt,
          type: k,
          value: rec.timeseries[dt][k]
        })
      })
    })
  })

  let cols = [ 'date', 'type', 'value' ].reduce((a, s) => {
    return a.concat([ { key: s, header: s } ])
  }, baseCsvColumns)
  return stringify( data, { header: true, columns: cols })
}


module.exports = {
  buildBaseJson,
  locations,
  timeseriesByLocation,

  timeseriesJhu,
  timeseriesTidy,
  timeseries
}
