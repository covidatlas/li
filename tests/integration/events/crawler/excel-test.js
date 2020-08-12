process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const { gunzipSync } = require('zlib')
const fs = require('fs')
const { join } = require('path')
const testCache = utils.testCache
const XLSX = require('xlsx')


test('can crawl Excel', async t => {
  await utils.setup()

  utils.copyFixture('excel-source/excel-data.xlsx', 'excel-data.xlsx')
  await utils.crawl('excel-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const crawledFile = join(utils.testCache.testingCache, testCache.allFiles()[0])
  const crawledContent = gunzipSync(fs.readFileSync(crawledFile))

  const srcFile = join(utils.fakeCrawlSites.baseFolder, 'excel-source', 'excel-data.xlsx')
  const srcContent = fs.readFileSync(srcFile)

  t.equal(crawledContent.toString(), srcContent.toString(), 'content strings match')

  // await utils.teardown()
  t.end()
})

test.only('crawled Excel file has same parseable content as source', async t => {
  const srcFile = join(utils.fakeCrawlSites.baseFolder, 'excel-source', 'excel-data.xlsx')
  const srcWkb = XLSX.readFile(srcFile)
  const srcSheets = srcWkb.SheetNames
  t.equal('cases, deaths', srcSheets.sort().join(', '), 'sanity check of src sheets')

  await utils.setup()
  utils.copyFixture('excel-source/excel-data.xlsx', 'excel-data.xlsx')
  await utils.crawl('excel-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const crawledFile = join(utils.testCache.testingCache, testCache.allFiles()[0])
  const crawledContent = gunzipSync(fs.readFileSync(crawledFile))

  const unzippedFile = join(utils.testCache.testingCache, 'zzdummy.xlsx')
  fs.writeFileSync(unzippedFile, crawledContent)
  const crawledWkb = XLSX.readFile(unzippedFile)
  const crawledSheets = crawledWkb.SheetNames
  t.equal('cases, deaths', crawledSheets.sort().join(', '), 'same sheets in dest')

  await utils.teardown()
  t.end()
})
