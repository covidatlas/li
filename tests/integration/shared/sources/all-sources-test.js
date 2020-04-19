const { join } = require('path')
const test = require('tape')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))


////////////////////////////////////////////////////////////////////
/** Crawl validation utility methods. */

// TODO (testing) Move utilities and dummy to a separate module and export them.

function crawlFunctionsFor(source) {
  const fns = source.scrapers.map(s => {
    return { startDate: s.startDate, crawl: s.crawl.filter(c => is.function(c.url)) }
  })
  return fns.filter(f => f.crawl.length > 0)
}

/** Return list of validation failures in array. */
function validateCrawlUrl(url) {
  const errs = []

  let ret = url
  if (is.function(url))
    ret =  url()

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
/** Testing the crawl validation utility methods.
 *
 * NOTE: The tests in this module were written before many sources
 * had been ported.  In order to verify that the tests _themselves_
 * were valid, we're using a fake scraper.  There are a set of tests
 * to validate the validation functions, using the fake scraper.
 */

// TODO: move this somewhere, scrapers should use it.
// DISCUSS: where?
/** Error thrown when a scraper data key is missing. */
class MissingScrapeDataError extends Error {
  constructor(keyname = 'default') {
    super(`Missing data ${keyname}`)
    this.name = 'MissingScrapeDataError'
  }
}

// TODO: move somewhere.
// DISCUSS: where?
/** Throws MissingScrapeDataError if hsh is null, or if any key values
 * are null. */
function validateKeys(hsh) {
  const nullOrUndef = (o) => { return (o === null || o === undefined) }
  if (nullOrUndef(hsh)) {
    throw new MissingScrapeDataError()
  }

  if (is.object(hsh)) {
    Object.keys(hsh).forEach(k => {
      if (nullOrUndef(hsh[k])) {
        throw new MissingScrapeDataError(k)
      }
    })
  }
}

/* eslint-disable no-unused-vars */

/** Fake scraper.  This scraper is checked during actual tests (of
 * actual sources) when ADD_FAKE_SCRAPER is defined in env:
 *
 * $ ADD_FAKE_SCRAPER=1 npm run test:integration
 */
let dummySource = {
  scrapers: [
    {
      startDate: '2020-04-01',
      crawl: [
        { name: 'cases', url: 'url' },
        { name: 'deaths', url: () => 'https://someurl.com' }
      ],
      scrape({cases, deaths}, date) {
        validateKeys({cases, deaths})
        // ...
      }
    },
    {
      startDate: '2020-04-02',
      crawl: [
        { url: () => 'http://ok.com' }
      ],
      scrape($, date) {
        validateKeys($)
        // ...
      }
    },
    {
      startDate: '2020-04-03',
      crawl: [
        { url: 'http://ok.com' }
      ]
      // No scrape, this is cache-only.
    }
  ]
}

/* eslint-enable no-unused-vars */

test('crawlFunctionsFor dummySource', t => {
  const actual = crawlFunctionsFor(dummySource).
        map(f => {
          const dt = f.startDate
          const s = f.crawl.map(c => c.name || 'default').join(',')
          return `${dt}-${s}`
        })
  const expected = ['2020-04-01-deaths', '2020-04-02-default']
  t.deepEqual(actual, expected, 'expected function names returned')
  t.end()
})

test('validateCrawlUrl, valid crawler urls', t => {
  const testcases = [
    { name: 'https', url: 'https://url' },
    { name: 'http', url: 'http://url' },
    { name: 'ret-string', url: () => { return 'https://someurl.com' } },
    { name: 'ret-object', url: () => { return { url: 'https://u.com', cookie: 'c' } } }
  ]
  testcases.forEach(testcase => {
    t.deepEqual(validateCrawlUrl(testcase.url), [], testcase.name || 'noname')
  })
  t.end()
})

test('validateCrawlUrl, invalid crawler urls', t => {
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
    const actual = validateCrawlUrl(testcase.crawler.url).join('; ')
    const expected = testcase.expected.join('; ')
    t.equal(actual, expected, testcase.crawler.name || 'noname')
  })
  t.end()
})

//////////////////////////////////////////////////////////////
// Actual crawl tests.

let sources = {}
for (const [key, src] of Object.entries(sourceMap())) {
  // eslint-disable-next-line
  sources[key] = require(src)
}

if (process.env.ADD_FAKE_SCRAPER) {
  console.log('Adding fake scraper for tests.')
  sources['FAKE'] = dummySource
}

if (process.env.ONLY_FAKE_SCRAPER) {
  sources = {}
  console.log('Using ONLY fake scraper for tests.')
  sources['FAKE'] = dummySource
}

const scraperDates = source => { return source.scrapers.map(s => s.startDate) }
const crawlsOnDate = (source, dt) => {
  return source.scrapers.filter(s => s.startDate === dt)[0].crawl
}
const scrapeOnDate = (source, dt) => {
  return source.scrapers.filter(s => s.startDate === dt)[0].scrape
}

// Create an array of hashes of "denormalized" crawl data, e.g:
//   [
//     {
//       key: 'gb-eng',
//       source: { country: 'iso1:GB', ... }
//       startDate: '2020-03-01',
//       crawl: { type: 'csv', url: ... }
//     }, ...
//   ]
const crawlMethods = Object.keys(sources).
      map(k => { return { key: k, source: sources[k] } }).
      map(h => {
        // Add all startDates.
        return scraperDates(h.source).map(d => {
          return { ...h, startDate: d }
        })
      }).
      flat().
      map(h => {
        // Add all crawls for source/startDate.
        return crawlsOnDate(h.source, h.startDate).map(c => {
          return { ...h, crawl: c }
        })
      }).
      flat()

/** Tests for crawlFunctions */
crawlMethods.filter(h => is.function(h.crawl.url)).
  forEach(c => {
    const s = c.crawl.name || '(default)'
    const baseTestName = `${c.key}: ${c.startDate} '${s}' url function`
    test(`${baseTestName} return value`, t => {
      const errs = validateCrawlUrl(c.crawl.url).join('; ')
      t.equal(errs, '')
      t.end()
    })

    /** TO DISCUSS: I think this is a valid test, need to sort out how
     * to get cache count. */
    test.skip(`${baseTestName} cache not touched`, t => {
      const getCacheCount = (n = 0) => { return 42 + n } // files.
      const oldCacheCount = getCacheCount()
      c.url()
      const newCacheCount = getCacheCount(1)
      t.equal(oldCacheCount, newCacheCount, 'cache not affected')
      t.end()
    })

    /*
      Discarded ideas:
      Originally I thought that these tests had value, but I'm not sure
      now.
      - Execute function should fail if no net connection (???)
      We can't be sure how devs will write methods.
      - Execute function should handle paginated data sources (???)
      Not sure how pagination will be implemented.
    */
  })


////////////////////////////////////////////////////////////////////
/** Scraper validation utility methods. */

// Build array of hashes of crawl names per date, e.g.:
//    [
//      {
//        key: 'FAKE',
//        source: { scrapers: [Array] },
//        startDate: '2020-04-01',
//        crawlnames: [ 'cases', 'deaths' ]  <-- has two crawls
//        scrape:
//      },
//      {
//        key: 'FAKE',
//        source: { scrapers: [Array] },
//        startDate: '2020-04-02',
//        crawlnames: [ 'undefined' ]   <-- has only one crawl, and hence no name.
//      }
//      ...
//    ]
const scrapes = Object.keys(sources).
      map(k => { return { key: k, source: sources[k] } }).
      map(h => {
        // Add all startDates, and crawl names and scrape function per start date.
        return scraperDates(h.source).map(d => {
          const names = crawlsOnDate(h.source, d).map(c => c.name || 'undefined')
          const s = scrapeOnDate(h.source, d)
          return { ...h, startDate: d, names: names, scrape: s }
        })
      }).
      flat().
      // Remove any "null scrapes" (i.e., cache-only sources)
      filter(s => s.scrape)

function makeObjectWithKeys(keys) {
  return keys.reduce((obj, key) => {
    obj[key] = 'some_data'
    return obj}, {})
}

function shouldFailWithError(t, func, errType, errMessageRegex) {
  let err = null
  let errMsg = null
  try { func() }
  catch (e) {
    err = e
    errMsg = err.message
  }
  t.ok(err !== null, 'threw an error')
  t.ok(err instanceof errType, `error type was ${err.constructor.name}`)
  t.ok(errMessageRegex.test(errMsg), `error msg '${errMsg}' matches ${errMessageRegex}`)
}

// Test all scrapes that have multiple crawl sources.
scrapes.filter(h => (h.names.join(',') !== 'undefined')).
  forEach(c => {
    const baseTestName = `${c.key}: ${c.startDate} scrape argument`
    test(`${baseTestName} missing object key throws MissingScrapeDataError`, t => {
      c.names.forEach(n => {
        let arg = makeObjectWithKeys(c.names)
        delete arg[n]
        shouldFailWithError(t, () => { c.scrape(arg) }, MissingScrapeDataError, new RegExp(`${n}`))
        // t.throws(() => { c.scrape(arg) }, MissingScrapeDataError)
      })
      t.end()
    })

    test(`${baseTestName} with all keys does not throw MissingScrapeDataError`, t => {
      let arg = makeObjectWithKeys(c.names)
      let error = null
      try {
        c.scrape(arg)
      } catch (err) {
        error = err
      }
      t.ok(error === null || !(error instanceof MissingScrapeDataError))
      t.end()
    })

  })

// Test all scrapes with single crawl source.
scrapes.filter(h => (h.names.join(',') === 'undefined')).
  forEach(c => {
    const baseTestName = `${c.key}: ${c.startDate} scrape argument`
    test(`${baseTestName} null throws MissingScrapeDataError`, t => {
      t.throws(() => { c.scrape(null) }, MissingScrapeDataError)
      t.end()
    })

    test(`${baseTestName} non-null does not throw MissingScrapeDataError`, t => {
      let error = null
      try {
        c.scrape('some-data')
      } catch (err) {
        error = err
      }
      t.ok(error === null || !(error instanceof MissingScrapeDataError))
      t.end()
    })
  })


/*
Scrape tests
Scrape should throw specific error if the object sent doesn’t meet validation requirements.
Scrape test doesn’t throw for NotImplementedException
Scrape test doesn’t throw for DeprecatedException
Scrape returns data matching minimal json schema specification.
Scrape data numeric fields should be sensible.
Scrape makes no HTTP calls
*/
