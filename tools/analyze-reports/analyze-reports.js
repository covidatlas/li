const fs = require('fs')
const path = require('path')
const stringify = require('csv-stringify/lib/sync')


/**
 * Utils
 */


/** Get array of dates covering all timeseries dates for all locations. */
function buildDateRange (locations) {
  const allDates = [ ...new Set(locations.map(loc => Object.keys(loc.timeseries)).flat()) ].sort()
  // console.log(allDates)
  const firstDate = new Date(allDates[0])
  const lastDate = new Date(allDates.slice(-1)[0])

  let dateRange = []
  const nextDay = (i) => { return new Date(i.getFullYear(), i.getMonth(), i.getDate() + 1) }
  for (let i = firstDate; i <= lastDate; i = nextDay(i)) {
    dateRange.push(i.toISOString().split('T')[0])
  }
  dateRange = [ ...new Set(dateRange) ].sort()
  // console.log(`Date range ${firstDate} to ${lastDate}`)

  return dateRange
}


/** Convert a location hash to a CSV report structure. */
function toCsvHash (location) {
  const seed = {
    name: [ location.countryName, location.stateName, location.countyName ].filter(s => s).join(', '),
    locationID: location.locationID,
    sources: location.sources.join(', ')
  }

  const dates = Object.keys(location.timeseries)
  return dates.reduce((rec, dt) => Object.assign(rec, { [dt]: '✓' }), seed)
}


/** Analyze timeseries data. */
function analyzeTimeseriesByLocation (locations) {
  const csvData = locations.map(toCsvHash)
  const cols = [ 'name', 'locationID', 'sources' ].concat(buildDateRange(locations))
  const csvOutput = stringify(csvData, { columns: cols, header: true, delimiter: ';' })
  // console.log(csvOutput)

  const saveTo = path.join(__dirname, 'analysis')
  if (!fs.existsSync(saveTo)){
    fs.mkdirSync(saveTo)
  }

  const f = path.join(saveTo, 'timeseries-byLocation-dates.csv')
  fs.writeFileSync(f, csvOutput)
  console.log(`\nGenerated analysis/timeseries-byLocation-dates.csv\n(import into google sheets to find data gaps)\n`)
}


/**
 * Main
 */


async function main () {
  const downloadPath = path.join(__dirname, 'downloadedReports')
  const fp = path.join(downloadPath, 'timeseries-byLocation.json')
  const json = JSON.parse(fs.readFileSync(fp))
  analyzeTimeseriesByLocation(json)
}


main()
