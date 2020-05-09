process.env.NODE_ENV = 'testing'

const test = require('tape')
const { join } = require('path')
const intDir = join(process.cwd(), 'tests', 'integration')
const intLib = join(process.cwd(), 'tests', 'integration', '_lib')
const sandbox = require(join(intLib, 'sandbox.js'))
const testCache = require(join(intLib, 'testcache.js'))

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))

test('Setup', async t => {
  t.plan(1)
  await sandbox.start()
  t.pass('Done')
})

test('Source map contains fake', async t => {
  t.plan(1)
  process.env.LI_SOURCES_PATH = join(intDir, 'fake-sources')
  const keys = Object.keys(sourceMap())
  t.ok(keys.includes('fake'), `should have fake source in keys [ ${keys.join()} ]`)
  delete process.env.LI_SOURCES_PATH
})

test('crawl saves files to cache', async t => {
  testCache.setup()
  /*
    copy things to integration testing of local host
    run crawl for the fake
    files should be in the testing location
  */
  testCache.teardown()
  t.end()
})

test('Teardown', async t => {
  t.plan(1)
  console.log('stopping sandbox')
  await sandbox.stop()
  t.pass('Done')
})
