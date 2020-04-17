const { join } = require('path')
const test = require('tape')
const assert = require('assert')
const is = require('is')

const srcShared = join(process.cwd(), 'src', 'shared')
const datetime = require(join(srcShared, 'datetime', 'index.js'))
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))

let warnings = []
test('Scraper validation test', t => {
  const sources = sourceMap()
  t.plan(Object.keys(sources).length)

  for (const [key, src] of Object.entries(sources)) {
    try {
      // eslint-disable-next-line
      const source = require(src)
      assert.ok(typeof source === 'object', 'Source must be an exported CommonJS object')

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
      assert.ok(country, 'Source must contain a country string')
      assert.ok(country.startsWith('iso1:') && country.length === 7, `Country must be a properly formatted ISO key (e.g. 'iso1:US')`)

      // State
      // TODO enforce ISO?
      if (state) assert.ok(is.string(state), 'State must be a string')

      // County
      if (county) assert.ok(is.string(county), 'County must be a string')

      // Timezone
      if (tz) assert.ok(is.string(tz), 'Timezone must be a string')

      // Scrapers
      assert.ok(is.array(scrapers), 'Scrapers must be an array')
      assert.ok(scrapers.length, 'Scrapers must have at least one scraper')

      // Now look inside each scraper
      for (const scraper of scrapers) {
        const { startDate, crawl, scrape } = scraper

        // Start date
        assert.ok(is.string(startDate), 'Scraper must contain a startDate')
        assert.ok(datetime.looksLike.YYYYMMDD(startDate), 'startDate must be ISO formatted (YYYY-MM-DD)')

        // Crawl
        assert.ok(is.array(crawl), 'Scraper must contain a crawl array')
        assert.ok(crawl.length, 'Crawl array must have at least one crawler')

        // Ok, now let's go into the crawler(s)
        let crawlerNames = {}
        for (const crawler of crawl) {
          const { type, data, url } = crawler

          // Crawl type
          const types = /(^page$)|(^headless$)|(^csv$)|(^tsv$)|(^pdf$)|(^json$)|(^raw$)/
          assert.ok(types.test(type), 'Crawler type must be one of: page, headless, csv, tsv, pdf, json, raw')

          // Crawl data format type (for ranking I guess?)
          assert.ok(is.string(data) || !data, 'Crawler data must be a string')

          // Crawl URL
          assert.ok(is.string(url) || is.function(url), 'Crawler url must be a string or function')

          // Crawl name keys
          if (crawl.length === 1) {
            assert.ok(!crawler.name, 'Single crawlers must not have a name key')
          }
          else {
            assert.ok(crawler.name, 'Multiple crawlers must have a name')
            assert.ok(crawler.name !== 'default', `Crawler name cannot be 'default'`)
            assert.ok(/^[a-z]+$/.test(crawler.name), `Crawler name must be lowercase letters only`)
            assert.ok(crawler.name.length <= 20, `Crawler name must be 20 chars or less`)
            assert.ok(!crawlerNames[crawler.name], 'Crawler names must be unique')
            crawlerNames[crawler.name] = true
          }
        }

        // Scrape (optional, allows crawl-only sources that need scrapers for later)
        if (scrape) {
          assert.ok(is.function(scrape), 'Scrape must be a function')
          if (scrape.constructor.name === 'AsyncFunction') {
            warnings.push(`Source contains an async scraper; scrapers should only contain synchronous logic. See: ${key}`)
          }
        }
        else {
          warnings.push(`Source contains a crawl-only scraper; please add scraper logic ASAP! See: ${key}`)
        }
      }

      // Friendly
      if (friendly) {
        assert.ok(is.object(friendly), 'Friendly must be an object')
        assert.ok(is.string(friendly.name) || !friendly.name, 'Friendly name must be a string')
        assert.ok(is.string(friendly.url) || !friendly.url, 'Friendly url must be a string')
      }

      // Priority
      if (priority) assert.ok(is.number(priority), 'Priority must be a number')

      // End date
      if (endDate) assert.ok(datetime.looksLike.YYYYMMDD(endDate), 'endDate must be ISO formatted (YYYY-MM-DD)')

      // Optional and legacy fields
      const { url, type, data, maintainers } = source
      if (url) warnings.push(`Source contains a 'url' param; please move this into a crawler. See: ${key}`)
      if (type) warnings.push(`Source contains a 'type' param; please move this into a crawler. See: ${key}`)
      if (data) warnings.push(`Source contains a 'data' param; please move this into a crawler. See: ${key}`)
      if (!maintainers) warnings.push(`Source does not list any maintainers, please list one or more! See: ${key}`)

      t.pass(`${key} looks good!`)
    }
    catch (err) {
      t.fail(err)
      console.log('Source:', src)
    }
  }
  if (warnings.length) {
    setTimeout(() => {
      console.warn('')
      console.warn('⚠️  Warnings!')
      for (const warn of warnings) {
        console.warn(warn)
      }
    }, 100)
  }
})
