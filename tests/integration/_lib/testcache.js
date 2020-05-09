const path = require('path')
const fs = require('fs')
const glob = require('glob').sync
const globJoin = require('../../../src/shared/utils/glob-join.js')

/** A fake cache, destroyed and re-created for the test run. */
const testingCache = path.join(process.cwd(), 'zz-testing-fake-cache')

/** Create the testing cache dir, and use it during operation. */
function setup () {
  if (fs.existsSync(testingCache)) {
    fs.rmdirSync(testingCache, { recursive: true })
  }
  fs.mkdirSync(testingCache)
  console.log(`Created test cache ${testingCache}`)
  process.env.LI_CACHE_PATH = testingCache
}

/** Delete the testing cache, and stop using it. */
function teardown () {
  if (fs.existsSync(testingCache)) {
    fs.rmdirSync(testingCache, { recursive: true })
  }
  console.log(`Deleted test cache ${testingCache}`)
  delete process.env.LI_CACHE_PATH
}

/** Get all files from test cache. */
function allFiles () {
  const globPattern = globJoin(testingCache, '**', '*.*')
  const filePaths = glob(globPattern)
  return filePaths.map(s => s.replace(testingCache + path.sep, ''))
}

module.exports = {
  testingCache,
  setup,
  teardown,
  allFiles
}
