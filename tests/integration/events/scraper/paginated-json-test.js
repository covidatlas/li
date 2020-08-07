process.env.NODE_ENV = 'testing'

const utils = require('../../_lib/utils.js')
const test = require('tape')
const testCache = utils.testCache

const firstPage = {
  records: [
    { counter: 'a1', cases: 1 },
    { counter: 'a2', cases: 2 }
  ],
  nextUrl: 'page2.json'
}

const lastPage = {
  records: [
    { counter: 'a3', cases: 3 }
  ]
}


async function doCrawl (t) {
  try {
    await utils.crawl('paginated-json')
    t.pass('crawl succeeded')
  }
  catch (err) {
    t.fail(err)
    t.fail(err.stack)
  }
}

async function doScrape (t) {
  let fullResult
  try {
    fullResult = await utils.scrape('paginated-json')
    t.pass('scrape succeeded')
  }
  catch (err) {
    t.fail(err)
    t.fail(err.stack)
  }
  return fullResult
}

test('scrape completes successfully', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)
  t.equal(2, testCache.allFiles().length, 'sanity check, all files after crawl.')

  await doScrape(t)

  await utils.teardown()
  t.end()
})

test('scrape gets all pages of data', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)

  let fullResult = await doScrape(t)

  const expected = [
    { counter: 'a1', cases: 1, deaths: 5 },
    { counter: 'a2', cases: 2, deaths: 5 },
    { counter: 'a3', cases: 3, deaths: 5 }
  ]
  utils.validateResults(t, fullResult, expected)

  await utils.teardown()
  t.end()
})


test('can scrape many pages', async t => {
  await utils.setup()

  function makeCaseFile (n) {
    const content = { records: [ { counter: 'a' + n, cases: n } ] }
    if (n <= 19)
      content.nextUrl = `page${n + 1}.json`
    utils.writeFakeSourceContent(`paginated-json/page${n}.json`, content)
  }
  for (let i = 1; i <= 20; i++)
    makeCaseFile(i)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)

  let fullResult = await doScrape(t)

  const expected = [ ...Array(20).keys() ].
        map(n => { return { counter: 'a' + (n + 1), cases: (n + 1) } })
  utils.validateResults(t, fullResult, expected)

  await utils.teardown()
  t.end()
})
