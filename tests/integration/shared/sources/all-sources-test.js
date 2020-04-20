const { join } = require('path')
const fs = require('fs')
const test = require('tape')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))
const allowedTypes = require(join(srcShared, 'sources', '_lib', 'types.js')).allowedTypes
const parseCache = require(join(process.cwd(), 'src', 'events', 'scraper', 'parse-cache', 'index.js'))
const loadFromCache = require(join(process.cwd(), 'src', 'events', 'scraper', 'load-cache', 'index.js'))


////////////////////////////////////////////////////////////////////
/** Crawl validation utility methods. */

// TODO (testing) Move utilities and fake to a separate module and export them.

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

// TODO: move this somewhere, scrapers should use it.
// DISCUSS: where?
/** Error thrown when scraper data does not pass validation. */
class DataLayoutChangedError extends Error {
  constructor(message = '<no details>') {
    super(`Data validation error: ${message}`)
    this.name = 'DataLayoutChangedError'
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

// ////////////////////////////////////////////////////////////
// Fake Source

/* eslint-disable no-unused-vars */

/** Fake scraper.  This scraper is checked during actual tests
 * when ONLY_FAKE_SCRAPER env value is set:
 *   ONLY_FAKE_SCRAPER=1 npm run test:integration
 */

/** For this fake source, we assume it's good if every crawl data = 'GOOD'.
 * (Note this is regardless of the type!) */
function fakeFormatValidation(obj) {
  if (is.string(obj)) {
    if (obj !== 'GOOD')
      throw new DataLayoutChangedError()
    return
  }

  if (is.object(obj)) {
    const failed = Object.keys(obj).reduce((acc, key) => {
      // console.log(` checking ${key}, accumulating onto [${acc}]`)
      if (obj[key] !== 'GOOD')
        acc.push(key)
      return acc
    }, [])
    if (failed.length > 0) {
      throw new DataLayoutChangedError(failed.join(', '))
    }
    return
  }

  throw new Error('Unhandled case in fakeSource?')
}

let fakeSource = {
  tz: 'America/Los_Angeles',
  scrapers: [
    {
      startDate: '2020-04-01',
      crawl: [
        { name: 'cases', type: 'csv', url: 'url' },
        { name: 'deaths', type: 'json', url: () => 'https://someurl.com' }
      ],
      scrape({cases, deaths}, date) {
        validateKeys({cases, deaths})
        fakeFormatValidation({cases, deaths})
        // ...
      }
    },
    {
      startDate: '2020-04-02',
      crawl: [
        { type: 'page', url: () => 'http://ok.com' }
      ],
      scrape($, date) {
        validateKeys($)
        fakeFormatValidation($)
        // ...
      }
    },
    {
      startDate: '2020-04-03',
      crawl: [
        { type: 'pdf', url: 'http://ok.com' }
      ]
      // No scrape, this is cache-only.
    },
    {
      startDate: '2020-04-04',
      crawl: [
        { type: 'pdf', url: 'http://ok.com' }
      ],
      scrape(pdf, date) {
        validateKeys(pdf)
        fakeFormatValidation(pdf)
        // ...
      }
    }
  ]
}

// Load a new scraper with all types to fakeSource
const crawlEntries = allowedTypes.map(t => {
  return {
    name: t,
    type: t,
    url: `http://get-me-a-${t}.com`
  }
})
// console.log(crawlEntries)

// TODO (techdebt) can we create the named arguments for scrape() using allowedTypes?
const newScraper = {
  startDate: '2020-04-10',
  crawl: crawlEntries,
  scrape({ page, headless, csv, tsv, pdf, json, raw }, date) {
    validateKeys({ page, headless, csv, tsv, pdf, json, raw })
    fakeFormatValidation({ page, headless, csv, tsv, pdf, json, raw })
    // ...
  }
}

fakeSource.scrapers.push(newScraper)
// console.log(fakeSource)


/** The fakeSource data isn't actually loaded into cache.  For all
 * keys in the crawl, return the string 'GOOD' for the
 * data (regardless of type).
 */
function fakeSourceLoadCacheResultFor(date) {
  const scrapers = fakeSource.scrapers.filter(s => s.startDate <= date)
  // console.log(scrapers)
  if (scrapers.length === 0)
    return null
  const crawlers = scrapers[scrapers.length - 1].crawl
  if (crawlers.length === 1)
    return 'GOOD'
  const ret = crawlers.map(c => c.name).
        reduce((acc, s) => { return { ...acc, [s]: 'GOOD' } }, {})
  // console.log(ret)
  return ret
}

test('Sanity check, fakeSourceLoadCacheResultFor', t => {
  const f = fakeSourceLoadCacheResultFor  // shorthand
  t.ok(f('2020-03-29') === null, '3/29')
  t.deepEqual(f('2020-04-01'), { cases: 'GOOD', deaths: 'GOOD' }, '4/1')
  t.equal(f('2020-04-02'), 'GOOD', '4/2')
  t.equal(f('2020-04-03'), 'GOOD', '4/3')
  t.equal(f('2020-04-04'), 'GOOD', '4/4')

  const allTypes = {
    page: 'GOOD',
    headless: 'GOOD',
    csv: 'GOOD',
    tsv: 'GOOD',
    pdf: 'GOOD',
    json: 'GOOD',
    raw: 'GOOD'
  }
  t.deepEqual(f('2020-04-15'), allTypes, '4/15')
  t.end()
})


/* eslint-enable no-unused-vars */

// End Fake Source
// ////////////////////////////////////////////////////////////


test('crawlFunctionsFor fakeSource', t => {
  const actual = crawlFunctionsFor(fakeSource).
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

// Don't do this: we shouldn't be mixing fakes with real things.
// if (process.env.ADD_FAKE_SCRAPER) {
//   console.log('Adding fake scraper for tests.')
//   sources['FAKE'] = fakeSource
// }

if (process.env.ONLY_FAKE_SCRAPER) {
  sources = {}
  console.log('Using ONLY fake scraper for tests.')
  sources['FAKE'] = fakeSource
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

// Build array of hashes of scraper data per date, e.g.:
//    [
//      {
//        key: 'FAKE',
//        source: { scrapers: [Array] },
//        startDate: '2020-04-01',
//        crawl: [ crawl_1, crawl_2 ],
//        crawlnames: [ 'cases', 'deaths' ],  <-- has two crawls
//        scrape: [fn]
//      },
//      {
//        key: 'FAKE',
//        source: { scrapers: [Array] },
//        startDate: '2020-04-02',
//        crawl: [ crawl_1 ],
//        crawlnames: [ 'undefined' ],   <-- has only one crawl, and hence no name.
//        scrape: [fn]
//      }
//      ...
//    ]
const scrapes = Object.keys(sources).
      map(k => { return { key: k, source: sources[k] } }).
      map(h => {
        // Add all startDates, and crawl names and scrape function per start date.
        return scraperDates(h.source).map(d => {
          const crawls = crawlsOnDate(h.source, d)
          const names = crawls.map(c => c.name || 'undefined')
          const s = scrapeOnDate(h.source, d)
          return { ...h, startDate: d, names: names, crawl: crawls, scrape: s }
        })
      }).
      flat().
      // Remove any "null scrapes" (i.e., cache-only sources)
      filter(s => s.scrape)
// console.log(scrapes)

function makeObjectWithKeys(keys) {
  return keys.reduce((obj, key) => {
    obj[key] = 'some_data'
    return obj}, {})
}

/** Load an object as if parsed from the cache, using the bad return
 * values in fixtures/ directory. */
async function makeScrapeArgWithBadData(crawls) {
  const cacheHits = crawls.map(c => {
    const f = join(__dirname, 'fixtures', `bad.${c.type}`)
    return {
      data: fs.readFileSync(f),
      type: c.type,
      name: c.name
    }
  })
  // console.log(parseCache)
  const parsed = await parseCache(cacheHits)
  // console.log(parsed)

  if (crawls.length === 1) {
    const ret = Object.values(parsed)[0]
    console.log(`Single crawl, returning: ${ret}`)
    return ret
  }

  return parsed.reduce((acc, e) => { return { ...acc, ...e } })
}

function shouldFailWithError(t, func, errType, errMessageRegex = null) {
  let err = null
  let errMsg = null
  try { func() }
  catch (e) {
    err = e
    errMsg = err.message
  }
  t.ok(err !== null, 'should throw an error')
  if (err)
    t.ok(err instanceof errType, `error type was ${err.constructor.name}`)
  if (errMessageRegex) {
    t.ok(errMessageRegex.test(errMsg), `error msg '${errMsg}' matches ${errMessageRegex}`)
  }
}

/** For real sources, this actually calls loadFromCache.  For the
 * fakeSource, use fake responses. */
async function loadFromCacheForTests(source, scraper, date) {
  // TODO How can we ensure that this is set correctly?
  process.env.NODE_ENV = 'testing'
  if (source == fakeSource)
    return fakeSourceLoadCacheResultFor(date)
  const params = { source, scraper, date, tz: 'America/Los_Angeles' }
  const cache = await loadFromCache(params)
  const parsed = await parseCache(cache, date)
  return parsed
}

// Test all scrapes that have multiple crawl sources.
scrapes.filter(h => (h.names.join(',') !== 'undefined')).
  forEach(scraper => {
    const baseTestName = `${scraper.key}: ${scraper.startDate} scrape argument`
    test(`${baseTestName} missing object key throws MissingScrapeDataError`, t => {
      scraper.names.forEach(n => {
        let arg = makeObjectWithKeys(scraper.names)
        delete arg[n]
        shouldFailWithError(t, () => { scraper.scrape(arg) }, MissingScrapeDataError, new RegExp(`${n}`))
      })
      t.end()
    })

    test(`${baseTestName} with all keys does not throw MissingScrapeDataError`, t => {
      let arg = makeObjectWithKeys(scraper.names)
      let error = null
      try {
        scraper.scrape(arg)
      } catch (err) {
        error = err
      }
      t.ok(error === null || !(error instanceof MissingScrapeDataError))
      t.end()
    })

    test(`${baseTestName} with only bad data throws DataLayoutChangedError`, async t => {
      let arg = await makeScrapeArgWithBadData(scraper.crawl)
      shouldFailWithError(t, () => { scraper.scrape(arg) }, DataLayoutChangedError)
      t.end()
    })

  })

// Test all scrapes with single crawl source.
scrapes.filter(h => (h.names.join(',') === 'undefined')).
  forEach(scraper => {
    const baseTestName = `${scraper.key}: ${scraper.startDate} scrape argument`
    test(`${baseTestName} null throws MissingScrapeDataError`, t => {
      t.throws(() => { scraper.scrape(null) }, MissingScrapeDataError)
      t.end()
    })

    test(`${baseTestName} non-null does not throw MissingScrapeDataError`, t => {
      let error = null
      try {
        scraper.scrape('some-data')
      } catch (err) {
        error = err
      }
      t.ok(error === null || !(error instanceof MissingScrapeDataError))
      t.end()
    })

    test(`${baseTestName} with only bad data throws DataLayoutChangedError`, async t => {
      let arg = await makeScrapeArgWithBadData(scraper.crawl)
      shouldFailWithError(t, () => { scraper.scrape(arg) }, DataLayoutChangedError)
      t.end()
    })

  })


////////////////////////////////////////////////////////////////////
/** Master test

This set of tests runs live crawls and scrapes for today for all
sources using live data.

Since we can't rely 100% on live sites, nor on scrapes actually being
up-to-date with the latest changes on live sites, these tests print
out warnings in some cases, and failures in others.  The tests also
successively narrow down the set of checks run on sources, depending
on the status of prior steps.
*/

// fake var for demo only
let _cacheCount = 42

function getCacheCountFor(src, dt) {
  // TODO
  return _cacheCount;
}

/** TODO: this should return the proper object for scraping. */
async function doCrawl(src, dt) {
  // TODO
  // Sample data set, multiple sources:
  return { sourceA: { number: 42 }, sourceB: { number: 41 } }

  // Sample data set, single source:
  // return { cases: 42 }

  _cacheCount += 1
}

function getScrapeForDate(src, dt) {
  // TODO - filter and return correct one, or null if not there.
  return (obj) => { console.log('scraping') }
}

async function doScrape(scrape, dataToScrape) {
  // TODO
  scrape(dataToScrape)
  // throw errors back up
}

/**
 * During the masterTest (of crawl/scrape), we want to highlight
 * things that we should be aware of, but which aren't necessarily
 * failures.
 */
class TestWarningError extends Error {
  constructor(message) {
    super(`Test warning: ${message}`)
    this.name = 'TestWarningError'
  }
}

class CacheOnlyScraperError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CacheOnlyScraperError'
  }
}

// Errors are thrown back up to the calling function.
async function masterTest(t, key, src, dt) {
  // Crawl.
  // If the crawl doesn't work, it could be due to the source being down.
  // We can't depend on external sites, so report that as a warning only.
  // Hold on to the dataset returned so we can pass it to scrape.
  const oldCacheFileCount = getCacheCountFor(src, dt)
  let dataToScrape = null
  try {
    dataToScrape = await doCrawl(src, dt)
    t.ok(`${key}: crawl completed successfully`)
  } catch (err) {
    throw new TestWarningError(`${key}: crawl error: ${err}`)
  }
  const newCacheFileCount = getCacheCountFor(src, dt)
  if (newCacheFileCount === oldCacheFileCount)
    throw new TestWarningError(`${key}: Cache count didn't change`)

  if (dataToScrape === null)
    throw new Error(`${key}: null data?  Shouldn't happen if crawl worked!`)

  const scrape = getScrapeForDate(src, dt)
  if (scrape === null) {
    // cache-only source, do nothing, ignore later.
    throw new CacheOnlyScraperError(key)
  }

  // Scrape.  If the scrape failed, it could be because the source
  // format has changed.  We can't depend on that, and our tests
  // should not fail b/c of that, but should report a warning.
  try {
    await doScrape(scrape, dataToScrape)
    t.ok(`${key}: scrape completed successfully`)
  } catch (err) {
    throw new TestWarningError(`${key}: scrape error: ${err}`)
  }

  // If we got here, great.  We need to check if that scrape can
  // handle bad data.
  return [scrape, dataToScrape]
}


// Run the master test for each source.
// TODO: parallelize this for speed.  Will require changes in err throws and warnings.
const today = datetime.now()
for (const [key, src] of Object.entries(sources)) {

  // If the crawl and scrape are successful for the source, we'll
  // exercise the scrape method in further tests.
  let scrape = null
  let dataToScrape = null

  test(`crawl and scrape for ${key} for ${today}`, t => {
    try {
      [scrape, dataToScrape] = masterTest(t, key, src, today)
    } catch (err) {
      // TODO: handle warnings, cache-only scrapers differently
      t.fail(`${err}`)
    }
    finally {
      t.end()
    }
  })

  if (!(scrape && dataToScrape)) {
    // The crawl and scrape didn't complete successfully, don't bother
    // with further tests.
    continue
  }

  test(`${key} for ${today}: scrape throws if any data key is missing`, t => {
    // TODO - mostly implemented much further above.
  })

  test(`${key} for ${today}: scrape throws if any data is invalid`, t => {
    // TODO - mostly implemented much further above.
  })

})
