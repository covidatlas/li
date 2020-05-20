/**
 * Migrate and generate for the given CDS scraper.
 *
 * Sample call:
 *
 * node tools-migration/prep-cds.js US/CA/mono-county.js
*/

// Yes, I know this code is very messy!

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const sourceKey = require('../src/shared/sources/_lib/source-key.js')


function runCommand (command, dirname) {
  let raw = ''
  try {
    raw = execSync(command, { encoding: 'utf-8', cwd: dirname, stdio: 'inherit' })
  } catch (err) {
    console.log(err)
    console.log(err.stack)
    process.exit(1)
  }
  return raw
}

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

const liKey = sourceKey(cdsScraper.replace('scrapers', 'sources'))

// Run the generation in CDS
console.log('got ' + locPath)
console.log('which is sourceKey ' + liKey)

// The cache-migration.js in CDS migrates relative to process.cwd()
// ... but the command is executed from the root dir of CDS, so this
// mess drops the file back into the li directory here.
const cacheMigDest = path.join('..', 'li', 'crawler-cache')

let cmd = ''
runCommand(`rm -rf ${path.join(cacheMigDest, liKey)}`, cdsDir)
cmd = `node tools/generate-v1-cache.js node --dest ${cacheMigDest}  --location ${locPath}`
runCommand(cmd, cdsDir)

if (process.platform === 'darwin') {
  cmd = `say -v Alex "Done migration"`
  runCommand(cmd, cdsDir)
}

const distDest = `zz-dist-${liKey}`
runCommand(`rm -rf ${distDest}`, cdsDir)
cmd = `yarn timeseries --location ${locPath} --writeTo ${distDest}`
runCommand(cmd, cdsDir)

if (process.platform === 'darwin') {
  cmd = `say -v Alex "Done timeseries"`
  runCommand(cmd, cdsDir)
}
