const { join } = require('path')
const test = require('tape')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))


////////////////////////////////////////////////////////////////////
/** Validation utility methods. */

/** Get all crawl functions (e.g., "crawl.url = () => {...}") as an array of arrays.
 * Returns [ [source_key, crawl_start_date, crawler_array_entry] ... ]
 */

function getCrawlFunctions(sourceDictionary) {
  const crawlFunctions = []
  for (const [key, source] of Object.entries(sourceDictionary)) {
    const fns = source.scrapers.map(s => {
      return { startDate: s.startDate, funcs: s.crawl.filter(c => is.function(c.url)) }
    })
    fns.forEach(fn => {
      fn.funcs.forEach(func => {
        crawlFunctions.push([key, fn.startDate, func])
      })
    })
  }
  return crawlFunctions
}

/** Return list of validation failures in array. */
function validateCrawlFunction(crawl) {
  const errs = []
  if (is.string(crawl.url)) return errs

  const ret = crawl.url()
  if (!is.string(ret) && !is.object(ret)) errs.push('Not string or object')
  if (is.object(ret)) {
    const requiredKeys = 'cookie, url'
    const actualKeys = Object.keys(ret).sort().join(', ')
    if (actualKeys !== requiredKeys) {
      const msg = `Should have keys '${requiredKeys}', but got '${actualKeys}'`
      errs.push(msg)
    }
  }

  const actualUrl = is.object(ret) ? ret.url : ret
  const re = /^https?\:\/\/.*/
  if (!re.test(actualUrl)) errs.push(`url '${actualUrl}' does not match url pattern`)
  return errs
}

////////////////////////////////////////////////////////////////////
/** Testing the validation utility methods.
 *
 * NOTE: The tests in this module were written before many scrapers
 * had been ported.  In order to verify that the tests _themselves_
 * were valid, we're using a fake scraper.  There are a set of tests
 * to validate the validation functions, using the fake scraper.
 */

/** Fake scraper.  This scraper is checked when ADD_FAKE_SCRAPER is
 * defined in env:
 * $ ADD_FAKE_SCRAPER=1 npm run test:integration
 */
const dummyScraper = {
  scrapers: [
    {
      startDate: '2020-04-01',
      crawl: [
        { name: '1-string', url: 'url' },
        { name: '2-OK-f-string', url: () => 'https://someurl.com' }
      ],
    },
    {
      startDate: '2020-04-02',
      crawl: [
        { name: '2-string', url: 'url' },
        { name: '2-OK-f-string', url: () => 'https://someurl.com' },
      ],
    },
    {
      startDate: '2020-04-03',
      crawl: [
        { url: () => 'http://ok.com' }
      ]
    }
  ]
}

test('getCrawlFunctions', t => {
  const actual = getCrawlFunctions({ A: dummyScraper, B: dummyScraper })
  const names = actual.map(f => [f[0], f[1], f[2].name || 'noname'].join('-'))
  const expected = [
    'A-2020-04-01-2-OK-f-string',
    'A-2020-04-02-2-OK-f-string',
    'A-2020-04-03-noname',
    'B-2020-04-01-2-OK-f-string',
    'B-2020-04-02-2-OK-f-string',
    'B-2020-04-03-noname'
  ]
  t.deepEqual(names, expected, 'expected function names returned')
  t.end()
})

test('validateCrawlFunction, valid crawler urls', t => {
  const testcases = [
    { name: '1-string', url: 'url' },
    { name: '2-OK-f-string', url: () => { return 'https://someurl.com' } },
    { name: '2-string', url: 'url' },
    { name: '2-OK-f-string', url: () => { return 'https://someurl.com' } },
    { name: '2-OK-hash', url: () => { return { url: 'https://u.com', cookie: 'c' } } },
    { url: () => { return 'http://ok.com' } }
  ]
  testcases.forEach(testcase => {
    t.deepEqual(validateCrawlFunction(testcase), [], testcase.name || 'noname')
  })
  t.end()
})


test('validateCrawlFunction, invalid crawler urls', t => {
  const testcases = [
    {
      crawler: { name: '2-X-array', url: () => ['failure array'] },
      expected: [ 'Not string or object', "url 'failure array' does not match url pattern" ]
    },
    {
      crawler: { name: '2-X-number', url: () => 1234 },
      expected: [ 'Not string or object', "url '1234' does not match url pattern" ]
    },
    {
      crawler: { name: '2-X-no-cookie', url: () => { return { url: 'https://u.com' } } },
      expected: [ "Should have keys 'cookie, url', but got 'url'" ]
    }
  ]
  testcases.forEach(testcase => {
    const actual = validateCrawlFunction(testcase.crawler).join('; ')
    const expected = testcase.expected.join('; ')
    t.equal(actual, expected, testcase.crawler.name || 'noname')
  })
  t.end()
})

//////////////////////////////////////////////////////////////
// Actual tests.

let sources = {}
for (const [key, src] of Object.entries(sourceMap())) {
  // eslint-disable-next-line
  sources[key] = require(src)
}

/** Tests for crawlFunctions */
const crawlFunctions = getCrawlFunctions(sources)
for (const [key, dt, crawl] of crawlFunctions) {
  const s = crawl.name || '(default)'
  const testname = `${key}: ${dt} '${s}' url function`

  test(`${testname} return value`, t => {
    const errs = validateCrawlFunction(crawl).join('; ')
    t.equal(errs, '', errs)
    t.end()
  })

  /** TO DISCUSS: I think this is a valid test, need to sort out how
   * to get cache count. */
  test.skip(`${testname} cache not touched`, t => {
    const getCacheCount = (n = 0) => { return 42 + n } // files.
    const oldCacheCount = getCacheCount()
    crawl.url()
    const newCacheCount = getCacheCount(1)
    t.equal(oldCacheCount, newCacheCount, 'cache not affected')
    t.end()
  })

  /* Discarded ideas:
     Originally I thought that these tests had value, but I'm not sure
     now.

    - Execute function should fail if no net connection (???)
      We can't be sure how devs will write methods.

    - Execute function should handle paginated data sources (???)
      Not sure how pagination will be implemented.
  */

}



/*
Scrape tests

Scrape should throw specific error if the object sent doesn’t meet validation requirements.
Scrape should throw specific error if missing key.
Scrape test doesn’t throw for NotImplementedException
Scrape test doesn’t throw for DeprecatedException
Scrape returns data matching minimal json schema specification.
Scrape data numeric fields should be sensible.
Scrape makes no HTTP calls

*/
