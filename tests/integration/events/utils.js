/** Utility methods for integration tests. */

process.env.NODE_ENV = 'testing'

const sandbox = require('@architect/sandbox')
const path = require('path')
const intDir = path.join(process.cwd(), 'tests', 'integration')

/** Fake sources used by the tests. */
const sourcesPath = path.join(intDir, 'fake-sources')

const testCache = require(path.join(intDir, '_lib', 'testcache.js'))
const fakeCrawlSites = require(path.join(intDir, '_lib', 'fake-crawl-sites.js'))
const crawlerHandler = require(path.join(process.cwd(), 'src', 'events', 'crawler', 'index.js')).handler
const scraperHandler = require(path.join(process.cwd(), 'src', 'events', 'scraper', 'index.js')).handler

/** Create AWS event payload for the crawl/scrape handlers. */
function makeEventMessage (hsh) {
  return { Records: [ { Sns: { Message: JSON.stringify(hsh) } } ] }
}

async function setup () {
  await sandbox.start({ port: 5555, quiet: true })
  testCache.setup()
}

async function teardown () {
  fakeCrawlSites.deleteAllFiles()
  testCache.teardown()
  await sandbox.end()
}

/** Write file for fake sources.
 *
 * The fake sources (in `sourcesPath`) refer to urls under localhost, eg,
 * http://localhost:5555/tests/fake-source-urls/fake/fake.json.
 * `relPath` should be the part of the URL after fake-source-urls. */
function writeFakeSourceContent (relPath, data) {
  let content = data
  if (typeof(data) !== 'string')
    content = JSON.stringify(data)

  const parts = relPath.split('/')
  const folder = parts.slice(0, parts.length - 1).join(path.sep)
  const filename = parts.slice(parts.length - 1)[0]
  fakeCrawlSites.writeFile(folder, filename, content)
}

async function crawl (sourceKey) {
  const event = makeEventMessage({ source: sourceKey, _sourcesPath: sourcesPath })
  await crawlerHandler(event)
}

async function scrape (sourceKey) {
  const event = makeEventMessage({ source: sourceKey, _sourcesPath: sourcesPath })
  const fullResult = await scraperHandler(event)
  return fullResult
}

module.exports = {
  setup,
  teardown,
  writeFakeSourceContent,
  crawl,
  scrape
}
