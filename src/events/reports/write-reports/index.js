const caseDataFields = require('@architect/shared/constants/case-data-fields.js')
const stringify = require('csv-stringify/lib/sync')

function removeFields (rec, fields) {
  for (const f of fields)
    delete rec[f]
}


/** locations.json source. */
function locations (baseJson, writableStream) {
  if (!baseJson) throw new Error('baseJson data is required')
  const content = baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'timeseries', 'timeseriesSources', 'warnings', 'area', 'created', 'updated' ])
    return rec
  })
  writableStream.write(JSON.stringify(content, null, 2))
}

/** timeseries-byLocation.json source. */
function timeseriesByLocation (baseJson, writableStream) {
  if (!baseJson) throw new Error('baseJson data is required')
  const content = baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    removeFields(rec, [ 'area', 'created', 'updated' ])
    return rec
  })
  writableStream.write(JSON.stringify(content, null, 2))
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

/*
TODO use this
function writeHeaders (cols, writableStream) {
  writeableStream.write(stringify([ cols.map(c => c.header) ]))
}
*/

/** timeseries.csv source.
 *
 */
function timeseries (baseJson, writeableStream) {
  if (!baseJson) throw new Error('baseJson data is required')

  let cols = caseDataFields.concat('date').
      reduce((a, f) => a.concat([ { key: f, header: f } ]), baseCsvColumns)
  const headings = cols.map(c => c.header)
  writeableStream.write(stringify([ headings ]))

  const columns = cols.map(c => c.key)
  baseCsv(baseJson).forEach(rec => {
    Object.keys(rec.timeseries).forEach(dt => {
      const outrec = {
        ...rec,
        ...rec.timeseries[dt],
        date: dt
      }
      writeableStream.write(stringify([ outrec ], { columns }))
    })
  })
}

/** timeseries-jhu.csv source.
 *
 */
function timeseriesJhu (baseJson, writeableStream) {
  if (!baseJson) throw new Error('baseJson data is required')
  const allDates = baseJson.reduce((dates, loc) => {
    return dates.concat(Object.keys(loc.timeseries))
  }, [])
  const dates = [ ...new Set(allDates) ].sort()

  let cols = dates.reduce((a, d) => {
    return a.concat([ { key: d, header: d } ])
  }, baseCsvColumns)

  const headings = cols.map(c => c.header)
  writeableStream.write(stringify([ headings ]))

  const columns = cols.map(c => c.key)
  baseCsv(baseJson).forEach(rec => {
    const cases = Object.entries(rec.timeseries).
      reduce((hsh, e) => Object.assign(hsh, { [e[0]]: e[1].cases }), {})
    const outrec = Object.assign(rec, cases)
    writeableStream.write(stringify([ outrec ], { columns }))
  })
}


/** timeseries-tidy.csv source.
 *
 * Timeseries-tidy.csv is a _huge_ file (~256MB as of 2020-jun-30, in
 * CDS), as it repeats all of the baseCsvColumns for each type of case
 * data point.  This is too big to fit into memory in Lambda, and
 * kills the whole process, so we need to write it directly to a
 * compressed file.
 */
function timeseriesTidy (baseJson, writeableStream) {
  if (!baseJson) throw new Error('baseJson data is required')

  let cols = [ 'date', 'type', 'value' ].reduce((a, s) => {
    return a.concat([ { key: s, header: s } ])
  }, baseCsvColumns)
  const headings = cols.map(c => c.header)
  writeableStream.write(stringify([ headings ]))

  const columns = cols.map(c => c.key)
  baseCsv(baseJson).forEach(rec => {
    Object.keys(rec.timeseries).forEach(dt => {
      Object.keys(rec.timeseries[dt]).forEach(k => {
        const outrec = {
          ...rec,
          date: dt,
          type: k,
          value: rec.timeseries[dt][k]
        }
        writeableStream.write(stringify([ outrec ], { columns }))
      })
    })
  })
}


module.exports = {
  locations,
  timeseriesByLocation,

  timeseriesJhu,
  timeseriesTidy,
  timeseries
}
