process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const { gunzipSync } = require('zlib')
const fs = require('fs')
const { join } = require('path')
const testCache = utils.testCache


test('can crawl Excel', async t => {
  await utils.setup()

  utils.copyFixture('excel-source/excel-data.xlsx', 'excel-data.xlsx')
  await utils.crawl('excel-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const crawledFile = join(utils.testCache.testingCache, testCache.allFiles()[0])
  const crawledContent = gunzipSync(fs.readFileSync(crawledFile))

  const srcFile = join(utils.fakeCrawlSites.baseFolder, 'excel-source', 'excel-data.xlsx')
  const srcContent = fs.readFileSync(srcFile)

  t.equal(crawledContent.toString(), srcContent.toString(), 'content is the same as source')

  await utils.teardown()
  t.end()
})
