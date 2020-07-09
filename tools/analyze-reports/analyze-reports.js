const aws = require('aws-sdk')
const reportsBucket = require('../../src/shared/utils/reports-bucket.js')
const fs = require('fs')
const path = require('path')
const stringify = require('csv-stringify/lib/sync')


/**
 * Utils
 */


/** Download file from s3 */
function downloadFile (bucketName, key, saveTo) {
  const saveToFilePath = path.join(saveTo, key.split('/').slice(-1)[0])

  const params = {
    Bucket: bucketName,
    Key: key
  }

  console.log(`downloading ${key} from ${bucketName} ...`)
  const s3 = new aws.S3()
  s3.getObject(params, (err, data) => {
    if (err) {
      console.error(err)
      throw err
    }

    fs.writeFileSync(saveToFilePath, data.Body.toString())
    console.log(`Wrote ${saveToFilePath}`)
  })
}


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


const saveTo = path.join(__dirname, 'downloadedReports')
if (!fs.existsSync(saveTo)){
  fs.mkdirSync(saveTo)
}

if (process.argv.length === 3 && process.argv[2] === '--download') {
  downloadFile(reportsBucket(), 'beta/latest/timeseries-byLocation.json', saveTo)
}

const fp = path.join(saveTo, 'timeseries-byLocation.json')
const json = JSON.parse(fs.readFileSync(fp))
analyzeTimeseriesByLocation(json)
