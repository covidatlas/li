const fs = require('fs')
const path = require('path')


/**
 * Main
 */


function main (locationID) {
  const files = [ 'timeseries-byLocation.json', 'baseData.json' ]
  files.forEach(f => {
    console.log('\n\n')
    console.log('='.repeat(50))
    console.log(f)
    console.log()
    const downloadPath = path.join(__dirname, 'downloadedReports')
    const fp = path.join(downloadPath, f)
    const data = JSON.parse(fs.readFileSync(fp))
    const loc = data.filter(rec => rec.locationID === locationID)

    if (loc.length === 0) {
      console.log(`No match for locationID ${locationID}`)
    }
    else {
      console.log(JSON.stringify(loc, null, 2))
    }
  })
}


if (process.argv.length !== 3) {
  console.log('Please provide a locationID as an argument.')
  process.exit(1)
}

main(process.argv[2])
