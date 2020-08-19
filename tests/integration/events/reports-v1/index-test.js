process.env.NODE_ENV = 'testing'

const test = require('tape')
const { join } = require('path')
const fs = require('fs')
const utils = require('../../_lib/utils.js')


/** Report generation saves files to disk.  Rather than using
 * filewatchers, poll until an expected file count is reached. */
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


/** Convenience: print long json strings side-by-side for visual
 * comparison. */
function printSideBySide (actual, expected) {

  function getStringArray (json) {
    return JSON.stringify(json, null, 2).split('\n')
  }
  const actualOut = getStringArray(actual)
  const expectedOut = getStringArray(expected)

  // Pad the arrays of output until they're both equal
  // (simplifies subsequent printing).
  while (actualOut.length < expectedOut.length)
    actualOut.push('')
  while (expectedOut.length < actualOut.length)
    expectedOut.push('')

  const maxLen = Math.max( ...actualOut.map(s => s.length) )
  const printLine = (actualSide, expectedSide, sep = ' ') => {
    const s = [
      actualSide.padEnd(maxLen + 2, ' '),
      sep.repeat(5),
      expectedSide
    ].join(' ')
    console.log(s)
  }

  printLine('ACTUAL', 'EXPECTED')
  printLine('='.repeat(30), '='.repeat(30))
  for (let i = 0; i < actualOut.length; i++) {
    const sep = actualOut[i] !== expectedOut[i] ? '*' : ' '
    printLine(actualOut[i], expectedOut[i], sep)
  }
}


/** Compare generated report in testReportsDir to same filename in
 * ./expected-results/. */
function assertContentsEqual (t, filename) {
  const d = utils.testReportsDir.reportsDir  // shorthand
  const actualFilename = join(d, 'v1', filename)
  const expectedFilename = join(__dirname, 'expected-results', filename)

  function sortKeys(item) {
    const ordered = {}
    for (let key of Object.keys(item).sort()) {
      ordered[key] = item[key]
    }
    return ordered
  }

  function clean (f) {
    console.log(`cleaning ${f}`)
    let s = fs.readFileSync(f, 'UTF-8').
        replace(/\d{4}-\d{2}-\d{2}/g, 'YYYY-MM-DD').
        replace(/T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, 'THH:NN:SS.mmmZ').
        trim()
    if (filename.match(/timeseries.json$/))
      return JSON.parse(s)
    if (filename.match(/json$/))
      return JSON.parse(s).map(sortKeys)
    else
      return s
  }
  const actual = clean(actualFilename)
  const expected = clean(expectedFilename)

  if (filename.match(/json$/) && JSON.stringify(actual) !== JSON.stringify(expected))
    printSideBySide(actual, expected)
  t.deepEqual(expected, actual, `validate ${filename}`)
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

  await utils.generateReports(utils.sourcesPath, utils.testReportsDir.reportsDir)
  const reportStatus = await utils.waitForDynamoTable('report-generation-status', 10000, 200)
  console.table(reportStatus)

  const reports = [
    'baseData.json',
    'latest.json',
    'latest.csv',
    'locations.json',
    'locations.csv',
    'timeseries-byLocation.json',
    'timeseries-jhu.csv',
    'timeseries-tidy-small.csv',
    'timeseries.csv',
    'timeseries.json',
  ]

  let files = await waitForGeneratedFiles(reports.length)
  const msg = `expected ${reports.length} files, got ${files.length} (${files.join()})`
  t.equal(files.length, reports.length, msg)
  const expectedFiles = reports.sort().map(s => join('v1', s)).join()
  t.equal(files.sort().join(), expectedFiles)

  for (const f of reports)
    assertContentsEqual(t, f)

  await utils.teardown()
  t.end()
})
