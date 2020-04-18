const { join } = require('path')
const test = require('tape')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))

const sources = {}
for (const [key, src] of Object.entries(sourceMap())) {
  // eslint-disable-next-line
  sources[key] = require(src)
}

/** A minimal fake scraper with crawl defined.
 *
 * During dev of these tests, no scrapers with function crawlers
 * existed. This dummy scraper adds some good and bad crawler methods
 * to exercise the tests, so we can ensure everything would fail as
 * expected for bad scrapers.
 *
 * This scraper is checked when ADD_FAKE_SCRAPER is defined in env:
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
        { name: '2-X-array', url: () => ['failure array'] },
        { name: '2-X-number', url: () => 1234 },
        { name: '2-OK-hash', url: () => { return { url: 'https://u.com', cookie: 'c' } } },
        { name: '2-X-no-cookie', url: () => { return { url: 'https://u.com' } } }
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

if (process.env.ADD_FAKE_SCRAPER)
  sources['FAKE'] = dummyScraper


/** Crawl functions (e.g., "crawl.url = () => {...}") */
const crawlFunctions = []
for (const [key, source] of Object.entries(sources)) {
  const fns = source.scrapers.map(s => {
    return { startDate: s.startDate, funcs: s.crawl.filter(c => is.function(c.url)) }
  })
  fns.forEach(fn => {
    fn.funcs.forEach(func => {
      crawlFunctions.push([key, fn.startDate, func])
    })
  })
}

/** Tests for crawlFunctions */
for (const [key, dt, crawl] of crawlFunctions) {
  const s = crawl.name || '(default)'
  const testname = `${key}: ${dt} '${s}' url function`

  test(`${testname} return value`, t => {
    const ret = crawl.url()
    t.ok(is.string(ret) || is.object(ret), 'Is string or object')

    if (is.object(ret)) {
      t.ok(ret.url, 'Has url')
      t.ok(ret.cookie, 'Has cookie')
      t.equal(Object.keys(ret).length, 2, 'Only 2 keys returned')
    }

    const actualUrl = is.string(ret) ? ret : ret.url
    t.ok(/^https?\:\/\/.*/.test(actualUrl), 'return valid URL')
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

