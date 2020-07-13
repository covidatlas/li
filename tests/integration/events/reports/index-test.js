process.env.NODE_ENV = 'testing'

const test = require('tape')
const { join } = require('path')
const fs = require('fs')
const utils = require('../../_lib/utils.js')
const zlib = require('zlib')
const stream = require('stream')

async function waitForGeneratedFiles (fileCount, timeoutms = 10000, interval = 500) {
  return new Promise(resolve => {
    let remaining = timeoutms
    var check = async () => {
      remaining -= interval
      let files = utils.testReportsDir.allFiles()
      if (files.length === fileCount)
        resolve(files)
      else if (remaining < 0) {
        resolve(files)
      }
      else {
        console.log(`  waiting for ${fileCount} files, got ${files.length} (${remaining}ms left)`)
        setTimeout(check, interval)
      }
    }
    setTimeout(check, interval)
  })
}


/** Unnecessarily complicated code to ensure that the unzipped file is
 * actually unzipped and on disk when we expect it. */
async function unzipInPlace (zipfile) {
  const unzip = zlib.createGunzip()
  const writable = fs.createWriteStream(zipfile.replace('.gz', ''))

  // This promise is _required_ to ensure that everything actually
  // gets written to disk!
  const writeDonePromise = new Promise(
    fulfill => writable.on("finish", fulfill)
  )

  stream.pipeline(
    fs.createReadStream(zipfile),
    unzip,
    writable,
    (err) => {
      if (err)
        throw err
      else {
        console.log('unzipped')
      }
    }
  )
  unzip.flush()

  return writeDonePromise
}


test('files are generated', async t => {
  await utils.setup()
  t.equal(utils.testReportsDir.allFiles().length, 0, 'no files at start')

  const caseData = {
    cases: 21,
    deaths: 4,
    tested: 200,
    hospitalized: 5,
    icu: 2
  }
  utils.writeFakeSourceContent('json-source/data.json', caseData)
  await utils.crawl('json-source')
  await utils.scrape('json-source')

  const locations = await utils.waitForDynamoTable('locations', 10000, 200)
  t.equal(locations.length, 1, `Sanity check, have 1 location: ${JSON.stringify(locations, null, 2)}`)

  // Override load path for sources, since we're using fake sources
  // for these tests.
  await utils.generateReports(utils.sourcesPath, utils.testReportsDir.reportsDir)
  const reportStatus = await utils.waitForDynamoTable('report-status', 10000, 200)
  console.table(reportStatus)

  const reports = [
    'locations.json',
    'locations.csv',
    'timeseries-byLocation.json',
    'timeseries-jhu.csv',
    'timeseries-tidy-small.csv',
    'timeseries-tidy.csv.gz',
    'timeseries.csv'
  ]

  const expectedFiles = reports.concat([ 'baseData.json' ])
  let files = await waitForGeneratedFiles(expectedFiles.length)
  const msg = `expected ${expectedFiles.length} files, got ${files.length} (${files.join()})`
  t.equal(files.length, expectedFiles.length, msg)
  t.equal(files.sort().join(), expectedFiles.sort().join())

  const zipfile = join(utils.testReportsDir.reportsDir, 'timeseries-tidy.csv.gz')
  await unzipInPlace(zipfile)
  t.ok(fs.existsSync(zipfile.replace('.gz', '')), 'unzipped file exists')

  function assertContentsEqual (filename) {
    const actual = join(utils.testReportsDir.reportsDir, filename)
    const expected = join(__dirname, 'expected-results', filename)
    const clean = f => fs.readFileSync(f, 'UTF-8').replace(/\d{4}-\d{2}-\d{2}/g, 'YYYY-MM-DD')
    t.equal(clean(expected), clean(actual), `validate ${filename}`)
  }

  // Don't bother checking baseData.json content; it's not in our list
  // of published reports, and is used as an incidental step to
  // generate the actual reports.
  for (const f of reports.map(f => f.replace('.gz', ''))) {
    assertContentsEqual(f)
  }

  await utils.teardown()
  t.end()
})
