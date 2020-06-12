const { join } = require('path')
const test = require('tape')
const assert = require('assert')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))
const { validateSource } = require(join(srcShared, 'sources', '_lib', 'validate-source.js'))
const glob = require('glob').sync
const globJoin = require('../../../../src/shared/utils/glob-join.js')


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
        crawl: [
          { type: 'text' /* bad type */,
            url: 'https://somedata.csv',
            /* Can't have url and paginated, pag. must be async. */
            paginated: client => { return [ client.get(123) ] }
          } ],
        scrape (data) { return { cases: data.cases } }
      },
      {
        // (there should be a "startDate: '2020-03-02'," here)
        crawl: [ { name: 'default' /* omit name */, type: 'csv', url: 'https://somedata.csv' } ],
        async /* should by sync */ scrape (data) { return { cases: data.infected } }
      },
      {
        startDate: '2020-03-02',
        crawl: [ { name: 'default' /* omit name */, type: 'csv', url: 'https://somedata.csv' } ]
        // Warning: missing scrape method
      },
      {
        startDate: '2020-03-03',
        crawl: [
          { name: 'cases', type: 'csv', data: 'trash', url: 'https://somedata.csv' },
          { name: 'cases' /* dup. name */, type: 'page', url: 'https://somedata.html' }
        ],
        scrape (data) { return { cases: 42 + data.count } }
      }
    ]
  }

  t.plan(2)

  const result = validateSource(invalidSource)

  const expectedWarnings = [
    '2020-03-02: Missing scrape method; please add scrape logic ASAP!',
    'Missing maintainers, please list one or more!'
  ]
  t.deepEqual(result.warnings.sort(), expectedWarnings.sort(), 'expected warnings caught')

  const expectedErrors = [
    '(missing startDate): Async scraper; scrapers should only contain synchronous logic.',
    'Country must be a properly formatted ISO key (e.g. \'iso1:US\')',
    '2020-03-03: Duplicate crawler name \'cases\'; names must be unique',
    '2020-03-03: Invalid crawler.data \'trash\'; must be one of: table, list, paragraph',
    '2020-03-01: Invalid crawler.type \'text\'; must be one of: page, headless, csv, tsv, pdf, json, raw',
    '2020-03-01: Crawler must have either url or paginated, but not both',
    '2020-03-01: Crawler paginated must be an async function',
    'Scraper must contain a startDate',
    '2020-03-02: Single crawler must not have a name key',
    '(missing startDate): Single crawler must not have a name key'
  ]
  t.deepEqual(result.errors.sort(), expectedErrors.sort(), 'expected errors caught')
})


test('source scrapers must be ordered by startDate', t => {

  const src = {
    country: 'iso1:US',
    state: 'iso2:CA',
    scrapers: [
      {
        startDate: '2020-03-01',
        crawl: [ { type: 'csv', url: 'https://d.csv' } ],
        scrape (data) { return data.cases }
      },
      {
        startDate: '2020-03-03',
        crawl: [ { type: 'csv', url: 'https://d.csv' } ],
        scrape (data) { return data.cases }
      }
    ]
  }

  let result = validateSource(src)
  t.equal(result.errors.length, 0, 'no errors')

  src.scrapers[0].startDate = '2020-05-05'
  result = validateSource(src)
  t.equal(result.errors[0], 'Scrapers must be ordered by startDate')

  t.end()
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
