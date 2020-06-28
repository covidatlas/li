const caseDataFields = require('@architect/shared/constants/case-data-fields.js')
const stringify = require('csv-stringify/lib/sync')

function removeFields (rec, fields) {
  for (const f of fields)
    delete rec[f]
}

/** locations.json source. */
function locations (baseJson) {
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'timeseries', 'timeseriesSources', 'warnings', 'area', 'created' ])
    return rec
  })
}

/** timeseries-byLocation.json source. */
function timeseriesByLocation (baseJson) {
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'area', 'created' ])
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

  // TODO (reports) Move this to file-writing routine.
  let cols = caseDataFields.concat('date').
      reduce((a, f) => a.concat([ { key: f, header: f } ]), baseCsvColumns)
  return stringify( data, { header: true, columns: cols })
}

/** timeseries-jhu.csv source.
 *
 */
function timeseriesJhu (baseJson) {
  const allDates = baseJson.reduce((dates, loc) => {
    return dates.concat(Object.keys(loc.timeseries))
  }, [])
  const dates = [ ...new Set(allDates) ].sort()

  const data = baseCsv(baseJson).map(rec => {
    const caseTs = Object.entries(rec.timeseries).
      reduce((hsh, e) => Object.assign(hsh, { [e[0]]: e[1].cases }), {})
    return Object.assign(rec, caseTs)
  })

  // TODO (reports) Move this to file-writing routine.
  let cols = dates.reduce((a, d) => {
    return a.concat([ { key: d, header: d } ])
  }, baseCsvColumns)
  return stringify( data, { header: true, columns: cols })
}


/** timeseries-tidy.csv source.
 *
 */
function timeseriesTidy (baseJson) {
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

  // TODO (reports) Move this to file-writing routine.
  let cols = [ 'date', 'type', 'value' ].reduce((a, s) => {
    return a.concat([ { key: s, header: s } ])
  }, baseCsvColumns)
  return stringify( data, { header: true, columns: cols })
}


module.exports = {
  locations,
  timeseriesByLocation,
  timeseriesJhu,
  timeseriesTidy,
  timeseries
}
