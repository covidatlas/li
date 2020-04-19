const { join } = require('path')
const test = require('tape')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))


////////////////////////////////////////////////////////////////////
/** Validation utility methods. */

function crawlFunctionsFor(source) {
  const fns = source.scrapers.map(s => {
    return { startDate: s.startDate, crawl: s.crawl.filter(c => is.function(c.url)) }
  })
  return fns.filter(f => f.crawl.length > 0)
}

/** Return list of validation failures in array. */
function validateCrawlFunction(crawl) {
  const errs = []

  let ret = crawl.url
  if (is.function(crawl.url))
    ret =  crawl.url()

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

/** Return the crawl keys for a scraper for each date. */

////////////////////////////////////////////////////////////////////
/** Testing the validation utility methods.
 *
 * NOTE: The tests in this module were written before many scrapers
 * had been ported.  In order to verify that the tests _themselves_
 * were valid, we're using a fake scraper.  There are a set of tests
 * to validate the validation functions, using the fake scraper.
 */

/** Fake scraper.  This scraper is checked during actual tests (of
 * actual scrapers) when ADD_FAKE_SCRAPER is defined in env:
 *
 * $ ADD_FAKE_SCRAPER=1 npm run test:integration
 */
const dummyScraper = {
  scrapers: [
    {
      startDate: '2020-04-01',
      crawl: [
        { name: 'cases', url: 'url' },
        { name: 'deaths', url: () => 'https://someurl.com' }
      ],
    },
    {
      startDate: '2020-04-02',
      crawl: [
        { name: 'cases', url: 'url' },
        { name: 'deaths', url: () => 'https://someurl.com' },
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

test('crawlFunctionsFor dummyScraper', t => {
  const actual = crawlFunctionsFor(dummyScraper).
        map(f => {
          const dt = f.startDate
          const s = f.crawl.map(c => c.name || 'default').join(',')
          return `${dt}-${s}`
        })
  const expected = [
    '2020-04-01-deaths', '2020-04-02-deaths', '2020-04-03-default'
  ]
  t.deepEqual(actual, expected, 'expected function names returned')
  t.end()
})

test('validateCrawlFunction, valid crawler urls', t => {
  const testcases = [
    { name: 'https', url: 'https://url' },
    { name: 'http', url: 'http://url' },
    { name: 'ret-string', url: () => { return 'https://someurl.com' } },
    { name: 'ret-object', url: () => { return { url: 'https://u.com', cookie: 'c' } } }
  ]
  testcases.forEach(testcase => {
    t.deepEqual(validateCrawlFunction(testcase), [], testcase.name || 'noname')
  })
  t.end()
})


test('validateCrawlFunction, invalid crawler urls', t => {
  const testcases = [
    {
      crawler: { name: 'array', url: () => ['failure array'] },
      expected: [ 'Not string or object', "url 'failure array' does not match url pattern" ]
    },
    {
      crawler: { name: 'number', url: () => 1234 },
      expected: [ 'Not string or object', "url '1234' does not match url pattern" ]
    },
    {
      crawler: { name: 'no-cookie', url: () => { return { url: 'https://u.com' } } },
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

if (process.env.ADD_FAKE_SCRAPER) {
  console.log('Adding fake scraper to tests.')
  sources['FAKE'] = dummyScraper
}

if (process.env.ONLY_FAKE_SCRAPER) {
  sources = {}
  console.log('Using ONLY fake scraper to tests.')
  sources['FAKE'] = dummyScraper
}

/** Tests for crawlFunctions */
for (const [key, source] of Object.entries(sources)) {
  const crawlFuncs = crawlFunctionsFor(source)
  crawlFuncs.forEach(dateCrawl => {
    dateCrawl.crawl.forEach(c => {
      const s = c.name || '(default)'
      const testname = `${key}: ${dateCrawl.startDate} '${s}' url function`
      test(`${testname} return value`, t => {
        const errs = validateCrawlFunction(c).join('; ')
        t.equal(errs, '')
        t.end()
      })
    })
  })

  /** TO DISCUSS: I think this is a valid test, need to sort out how
   * to get cache count. */
  /*
  test.skip(`${testname} cache not touched`, t => {
    const getCacheCount = (n = 0) => { return 42 + n } // files.
    const oldCacheCount = getCacheCount()
    crawl.url()
    const newCacheCount = getCacheCount(1)
    t.equal(oldCacheCount, newCacheCount, 'cache not affected')
    t.end()
  })
  */


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

Scrape should throw specific error if missing key.
Scrape should throw specific error if the object sent doesn’t meet validation requirements.
Scrape test doesn’t throw for NotImplementedException
Scrape test doesn’t throw for DeprecatedException
Scrape returns data matching minimal json schema specification.
Scrape data numeric fields should be sensible.
Scrape makes no HTTP calls

*/
