process.env.NODE_ENV = 'testing'

const test = require('tape')
const { join } = require('path')
const intDir = join(process.cwd(), 'tests', 'integration')
const sandbox = require(join(intDir, '_lib', 'sandbox.js'))
const testCache = require(join(intDir, '_lib', 'testcache.js'))
const srcEvents = join(process.cwd(), 'src', 'events')
const crawlerHandler = require(join(srcEvents, 'crawler', 'index.js')).handler

const fs = require('fs')

test('Setup', async t => {
  await sandbox.start()
  t.end()
})

/** Create AWS event payload for the crawl/scrape handlers. */
function makeEventMessage (hsh) {
  return { Records: [ { Sns: { Message: JSON.stringify(hsh) } } ] }
}

/** The fake sources crawl localhost:5555, which the sandbox is
 * running on. */
function writeTestFile (subdir, filename, content) {
  const folder = join(process.cwd(), 'public', 'tests', 'fake-source-urls', subdir)
  if (!fs.existsSync(folder))
    fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(join(folder, filename), content)
}

test('crawl saves files to cache', async t => {
  process.env.LI_SOURCES_PATH = join(intDir, 'fake-sources')
  writeTestFile('fake', 'fake.json', JSON.stringify({ cases: 10, deaths: 20 }))

  testCache.setup()
  t.equal(0, testCache.allFiles().length, 'No files in cache.')

  await crawlerHandler(makeEventMessage({ source: 'fake' }))
  t.equal(1, testCache.allFiles().length, 'have file after crawl.')

  testCache.teardown()
  delete process.env.LI_SOURCES_PATH
  t.end()
})

test('Teardown', async t => {
  await sandbox.stop()
  t.end()
})
