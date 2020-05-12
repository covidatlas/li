process.env.NODE_ENV = 'testing'

const sandbox = require('@architect/sandbox')
const test = require('tape')
const { join } = require('path')
const intDir = join(process.cwd(), 'tests', 'integration')
const testCache = require(join(intDir, '_lib', 'testcache.js'))
const fakeCrawlSites = require(join(intDir, '_lib', 'fake-crawl-sites.js'))
const crawlerHandler = require(join(process.cwd(), 'src', 'events', 'crawler', 'index.js')).handler

/** Create AWS event payload for the crawl/scrape handlers. */
function makeEventMessage (hsh) {
  return { Records: [ { Sns: { Message: JSON.stringify(hsh) } } ] }
}

test('crawl saves files to cache', async t => {
  await sandbox.start({ port: 5555, quiet: true })

  const sourcesPath = join(intDir, 'fake-sources')
  fakeCrawlSites.writeFile('fake', 'fake.json', JSON.stringify({ cases: 10, deaths: 20 }))

  testCache.setup()
  t.equal(0, testCache.allFiles().length, 'No files in cache.')

  await crawlerHandler(makeEventMessage({ source: 'fake', _sourcesPath: sourcesPath }))
  t.equal(1, testCache.allFiles().length, 'have file after crawl.')

  testCache.teardown()
  await sandbox.end()
  t.end()
})
