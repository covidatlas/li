const aws = require('aws-sdk')
const reportsBucket = require('../../src/shared/utils/reports-bucket.js')
const fs = require('fs')
const path = require('path')


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


/** Analyze timeseries data. */
function analyzeTimeseriesByLocation (locations) {

  const data = locations.map(loc => {
    return {
      locationID: loc.locationID,
      dates: Object.keys(loc.timeseries)
    }
  })

  const allDates = [ ...new Set(data.map(d => d.dates).flat()) ].sort()
  const firstDate = new Date(allDates[0])
  const lastDate = new Date(allDates.slice(-1)[0])

  let dateRange = []
  const nextDay = (i) => { return new Date(i.getFullYear(), i.getMonth(), i.getDate() + 1) }
  for (let i = firstDate; i <= lastDate; i = nextDay(i)) {
    dateRange.push(i.toISOString().split('T')[0])
  }
  dateRange = [ ...new Set(dateRange) ].sort()
  // console.log(dateRange)
  // console.table(data)

  console.log(`Date range ${firstDate} to ${lastDate}`)

  const dateString = (loc) => dateRange.map(d => loc.dates.includes(d) ? 'Y' : '.')
  data.forEach(d => {
    console.log(dateString(d).join(''))
  })
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
