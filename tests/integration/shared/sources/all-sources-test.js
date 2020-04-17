const { join } = require('path')
const test = require('tape')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))

const sourceFiles = sourceMap()
const sources = {}
for (const [key, src] of Object.entries(sourceFiles)) {
  // eslint-disable-next-line
  sources[key] = require(src)
}

/** A minimal fake scraper with crawl defined.
 *
 * Development of these tests, no scrapers with function crawlers
 * existed. This dummy scraper adds some good and bad crawler methods
 * to exercise the tests, and ensure everything would fail as expected
 * for bad scrapers.
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

// I think there's a clever way to build this array using map etc, but
// this works too.
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

console.log(crawlFunctions)

for (const [key, date, crawl] of crawlFunctions) {
  test(`${key} ${date} crawl function ${crawl.name || 'undefined'}`, t => {
    t.ok('hi')
    t.end()
  })
}


  /*
    Execute function should return a URL string or obj {url, cookie}
    Execute function should not write to cache
    Execute function should fail if no net connection
    Execute function should handle paginated data sources
    URL format must be valid (?)
  */

/*
for (const [key, src] of Object.entries(sources)) {
  const name = `${key}.crawl url function`;
  test(`${key}`, t => {
    t.end();
  });
}
*/
