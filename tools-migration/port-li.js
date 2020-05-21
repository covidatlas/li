/**
 * Do prelim port if no file, and run verification.
 *
 * Sample call:
 *
 * node tools-migration/port-li.js US/CA/mono-county.js
*/

// Yes, I know this code is very messy!

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const sourceKey = require('../src/shared/sources/_lib/source-key.js')


function runCommand (command) {
  let raw = ''
  try {
    raw = execSync(command, { encoding: 'utf-8', stdio: 'inherit' })
  } catch (err) {
    console.log(err)
    console.log(err.stack)
    process.exit(1)
  }
  return raw
}

// Report end of boring process
function report (text) {
  if (process.platform === 'darwin') {
    cmd = `say -v Alex "${text}"`
    runCommand(cmd)
  }
}

////////////////////////////

const locPath = process.argv[2]
if (!locPath) {
  console.log(`No loc specified, quitting.`)
  process.exit(0)
}

const cdsDir = path.join(__dirname, '..', '..', 'coronadatascraper')
const cdsScraper = path.join(cdsDir, 'src', 'shared', 'scrapers', locPath)
if (!fs.existsSync(cdsScraper)) {
  console.log(`Missing scraper ${cdsScraper}`)
  process.exit(1)
}

const liFile = locPath.toLowerCase()
const liKey = sourceKey(cdsScraper.replace('scrapers', 'sources').toLowerCase())

// Run the generation in CDS
console.log('got ' + locPath)
console.log('migrating to ' + liFile)
console.log('which is sourceKey ' + liKey)

const liSource = path.join(process.cwd(), 'src', 'shared', 'sources', liFile)

let cmd = ''

if (fs.existsSync(liSource)) {
  console.log(`already have ${liKey}, skipping migration helper ...`)
}
else {
  cmd = `node tools-migration/migrate-cds-scraper.js ${cdsScraper} ${liFile}`
  runCommand(cmd)
}

runCommand(`npm run validate ${liKey}`)
runCommand(`npm run lint`)

// We may need at least one timeseries file, in case nothing was ported.
console.log('Crawling to load timeseries')
runCommand(`./start --crawl ${liKey}`)
console.log('crawl done.  Generating raw files from cache')

// Generate data
const dest = `zz-${liKey}-out`
runCommand(`rm -rf ${dest}`)
runCommand(`node tools/gen-raw-files.js --date 2020-03-16 --source ${liKey} --output ${dest}`)
report('data generated')

// CDS files expected to be in zz-dist-${liKey} in that project's root dir.
const cdsDist = path.join(cdsDir, `zz-dist-${liKey}`)
runCommand(`node tools-migration/report-cds-vs-li.js ${dest}/ ${cdsDist}`)
