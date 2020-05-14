const { join } = require('path')
const test = require('tape')
const assert = require('assert')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const datetime = require(join(srcShared, 'datetime', 'index.js'))
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))
const { allowed } = require(join(srcShared, 'sources', '_lib', 'crawl-types.js'))
const glob = require('glob').sync
const globJoin = require('../../../../src/shared/utils/glob-join.js')

/**
 * Validate the source.
 * Returns { warnings: [], errors: [] }
 */
function validateSource (source) {
  const result = { warnings: [], errors: [] }

  // Add to errors if check is falsey
  function requirement (meetsRequirement, msg) {
    if (!meetsRequirement) result.errors.push(msg)
  }

  // Add to warnings if needsWarning
  function warning (needsWarning, msg) {
    if (needsWarning) result.warnings.push(msg)
  }

  const {
    country,
    state,
    county,
    scrapers,
    friendly,
    tz,
    priority,
    endDate
  } = source

  // Country
  requirement(country, 'Source must contain a country string')
  requirement(
    country.startsWith('iso1:') && country.length === 7, `Country must be a properly formatted ISO key (e.g. 'iso1:US')`
  )

  // State
  // TODO enforce ISO?
  if (state) requirement(is.string(state), 'State must be a string')

  // County
  if (county) requirement(is.string(county), 'County must be a string')

  // Timezone
  if (tz) requirement(is.string(tz), 'Timezone must be a string')

  // Scrapers
  requirement(is.array(scrapers), 'Scrapers must be an array')
  requirement(scrapers.length, 'Scrapers must have at least one scraper')

  // Now look inside each scraper
  for (const scraper of scrapers) {
    const { startDate, crawl, scrape } = scraper

    const datedError = s => {
      return `${startDate || '(missing startDate)'}: ${s}`
    }

    // Start date
    requirement(is.string(startDate), 'Scraper must contain a startDate')
    if (startDate)
      requirement(datetime.looksLike.YYYYMMDD(startDate), datedError('startDate must be ISO formatted (YYYY-MM-DD)'))

    // Crawl
    requirement(is.array(crawl), 'Scraper must contain a crawl array')
    requirement(crawl.length, 'Crawl array must have at least one crawler')

    // Ok, now let's go into the crawler(s)
    let crawlerNames = {}
    for (const crawler of crawl) {
      const { type, format, url, timeout } = crawler

      // Crawl type
      requirement(allowed.some(a => a === type), datedError(
        `Invalid crawler type '${type}'; must be one of: page, headless, csv, tsv, pdf, json, raw`
      ))

      // Crawl data format type (for ranking I guess?)
      requirement(is.string(format) || !format, datedError('Crawler format must be a string'))

      // Crawl URL
      requirement(is.string(url) || is.function(url), datedError('Crawler url must be a string or function'))

      // Crawl name keys
      if (crawl.length === 1) {
        requirement(!crawler.name, datedError('Single crawler must not have a name key'))
      }
      else {
        requirement(crawler.name, 'Multiple crawlers must have a name')
        requirement(crawler.name !== 'default', datedError(`Crawler name cannot be 'default'`))
        requirement(/^[a-z]+$/.test(crawler.name), datedError(`Crawler name must be lowercase letters only`))
        requirement(crawler.name.length <= 20, datedError(`Crawler name must be 20 chars or less`))
        requirement(
          !crawlerNames[crawler.name], datedError(`Duplicate crawler name '${crawler.name}'; names must be unique`)
        )
        crawlerNames[crawler.name] = true
      }

      // Crawl timeout
      if (timeout) {
        requirement(is.number(timeout), 'Headless timeout must be a number')
        requirement(type === 'headless', `Headless timeout is not valid for ${type}`)
      }
    }

    // Scrape (optional, allows crawl-only sources that need scrapers for later)
    if (scrape) {
      requirement(is.function(scrape), datedError('Scrape must be a function'))
      requirement(
        scrape.constructor.name !== 'AsyncFunction',
        datedError(`Async scraper; scrapers should only contain synchronous logic.`)
      )
    }

    warning(!scrape, datedError(`Missing scrape method; please add scrape logic ASAP!`))
  }

  // Friendly
  if (friendly) {
    requirement(is.object(friendly), 'Friendly must be an object')
    requirement(is.string(friendly.name) || !friendly.name, 'Friendly name must be a string')
    requirement(is.string(friendly.url) || !friendly.url, 'Friendly url must be a string')
  }

  // Maintainers
  const { maintainers } = source
  warning(!maintainers, 'Missing maintainers, please list one or more!')
  if (maintainers) {
    const nullMaintainers = maintainers.filter(m => !m)
    requirement(nullMaintainers.length === 0, 'Should not have any null maintainers')
  }

  // Priority
  if (priority) requirement(is.number(priority), 'Priority must be a number')

  // End date
  if (endDate) requirement(datetime.looksLike.YYYYMMDD(endDate), 'endDate must be ISO formatted (YYYY-MM-DD)')

  // Optional and legacy fields
  const { url, type, data } = source
  warning(url, `Source contains a 'url' param; please move this into a crawler.`)
  warning(type, `Source contains a 'type' param; please move this into a crawler.`)
  warning(data, `Source contains a 'data' param; please move this into a crawler.`)

  return result
}

// Test docs
test('Documentation sample', t => {
  t.plan(2)
  // eslint-disable-next-line
  const validSource = require(join(process.cwd(), 'docs', 'sample-sources', 'sample.js'))
  const result = validateSource(validSource)
  t.equal(result.warnings.join('; '), '', 'no warnings')
  t.equal(result.errors.join('; '), '', 'no errors')
})

// Ensure the integration test fakes are valid!
test('Fake integration sources', t => {
  const fakesDir = [ __dirname, '..', '..', '..', 'integration', 'fake-sources', 'sources' ]
  const globPattern = globJoin(...fakesDir, '**', '*.js')
  const sources = glob(globPattern)
  sources.forEach(s => {
    // eslint-disable-next-line
    const source = require(s)
    const result = validateSource(source)
    t.equal(result.warnings.join('; '), '', `${s}: no warnings`)
    t.equal(result.errors.join('; '), '', `${s}: no errors`)
  })
  t.end()
})

// Test the test
test('validateSource catches problems', t => {

  // An source w/ many problems.
  const invalidSource = {
    country: 'badcode',
    state: 'badstate',
    aggregate: 'zipcode',
    scrapers: [
      {
        startDate: '2020-03-01',
        crawl: [ { type: 'text' /* bad type */, url: 'https://somedata.csv' } ],
        scrape (data) { return { cases: data.cases } }
      },
      {
        // (there should be a "startDate: '2020-03-02'," here)
        crawl: [ { name: 'default' /* omit name */, type: 'csv', url: 'https://somedata.csv' } ],
        async /* should by sync */ scrape (data) { return { cases: data.infected } }
      },
      {
        startDate: '2020-03-03',
        crawl: [ { name: 'default' /* omit name */, type: 'csv', url: 'https://somedata.csv' } ]
        // Warning: missing scrape method
      },
      {
        startDate: '2020-03-02',
        crawl: [
          { name: 'cases', type: 'csv', url: 'https://somedata.csv' },
          { name: 'cases' /* dup. name */, type: 'page', url: 'https://somedata.html' }
        ],
        scrape (data) { return { cases: 42 + data.count } }
      }
    ]
  }

  t.plan(2)

  const result = validateSource(invalidSource)

  const expectedWarnings = [
    '2020-03-03: Missing scrape method; please add scrape logic ASAP!',
    'Missing maintainers, please list one or more!'
  ]
  t.deepEqual(result.warnings.sort(), expectedWarnings.sort(), 'expected warnings caught')

  const expectedErrors = [
    '(missing startDate): Async scraper; scrapers should only contain synchronous logic.',
    'Country must be a properly formatted ISO key (e.g. \'iso1:US\')',
    '2020-03-02: Duplicate crawler name \'cases\'; names must be unique',
    '2020-03-01: Invalid crawler type \'text\'; must be one of: page, headless, csv, tsv, pdf, json, raw',
    'Scraper must contain a startDate',
    '2020-03-03: Single crawler must not have a name key',
    '(missing startDate): Single crawler must not have a name key'
  ]
  t.deepEqual(result.errors.sort(), expectedErrors.sort(), 'expected errors caught')
})

// Test the actual scrapers
let warnings = []
test('Scraper validation test', t => {
  const sources = sourceMap()

  t.plan(Object.keys(sources).length)

  for (const [ key, src ] of Object.entries(sources)) {
    try {
      // eslint-disable-next-line
      const source = require(src)
      assert.ok(is.object(source), 'Source must be an exported CommonJS object')

      const result = validateSource(source)
      result.warnings.forEach(w => warnings.push(`Source ${key}: ${w}`))
      if (result.errors.length === 0) {
        t.pass(`${key} looks good!`)
      }
      else {
        t.fail(`${key}: ${result.errors.join('; ')}`)
      }
    }
    catch (err) {
      t.fail(err)
    }
  }

  // Print warnings.
  if (warnings.length) {
    for (const warn of warnings) {
      console.log('Warning: ' + warn)
    }
  }
})
