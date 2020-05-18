process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const path = require('path')
const testCache = require('../../_lib/testcache.js')

test('crawl saves files to cache', async t => {
  await utils.setup()
  t.plan(2)

  utils.writeFakeSourceContent('fake/fake.json', { cases: 10, deaths: 20 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('fake')
  const files = testCache.allFiles()
  t.equal(1, testCache.allFiles().length, 'have file after crawl, ' + JSON.stringify(files))

  await utils.teardown()
})

test('file saved in correct path', async t => {
  await utils.setup()
  utils.writeFakeSourceContent('fake/fake.json', { cases: 10, deaths: 20 })
  await utils.crawl('fake')
  const all = testCache.allFiles()

  t.equal(1, all.length, 'have file after crawl.')
  const f = all[0]
  console.log('got file: ' + f)
  const parts = f.split(path.sep)

  t.equal(4, parts.length, 'key, date, datetime, filename')
  // If it's not 4 parts, this test hangs ...
  if (parts.length === 4) {
    t.equal(parts[0], 'fake', 'source key')

    const dateRe = /^\d{4}-\d{2}-\d{2}$/
    t.match(parts[1], dateRe, 'part 2 is date')

    const timeRe = /^\d{2}_\d{2}_\d{2}\.\d{3}z$/
    t.match(parts[2], timeRe, 'part 3 is time')

    t.match(parts[3], /^default-[a-z0-9]{5}.json.gz$/, 'filename includes name and sha')
  }

  await utils.teardown()
  t.end()
})
