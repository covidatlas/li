const path = require('path')
const fs = require('fs')
const glob = require('glob').sync
const globJoin = require('../../../src/shared/utils/glob-join.js')

/** Reports directory, destroyed and re-created for the test run. */
const reportsDir = path.join(process.cwd(), 'zz-reports-dir')

/** Create the testing cache dir, and use it during operation. */
function setup () {
  if (fs.existsSync(reportsDir)) {
    fs.rmdirSync(reportsDir, { recursive: true })
  }
  fs.mkdirSync(reportsDir)
  console.log(`Created test report dir ${reportsDir}`)
  process.env.LI_REPORT_PATH = reportsDir
}

/** Delete the testing cache, and stop using it. */
function teardown () {
  if (fs.existsSync(reportsDir)) {
    fs.rmdirSync(reportsDir, { recursive: true })
  }
  console.log(`Deleted test report dir ${reportsDir}`)
  delete process.env.LI_REPORT_PATH
}

/** Get all files from test cache. */
function allFiles () {
  const globPattern = globJoin(reportsDir, '**', '*.*')
  const filePaths = glob(globPattern)
  return filePaths.map(s => s.replace(reportsDir + path.sep, ''))
}

module.exports = {
  reportsDir,
  setup,
  teardown,
  allFiles
}
