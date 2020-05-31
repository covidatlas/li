const is = require('is')
const { join } = require('path')
const srcShared = join(process.cwd(), 'src', 'shared')
const datetime = require(join(srcShared, 'datetime', 'index.js'))
const { allowed } = require('./crawl-types.js')

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

  const startDates = scrapers.map(s => s.startDate).filter(s => s !== undefined)
  const sortedStartDates = new Array(...startDates).sort()
  requirement(startDates.join() === sortedStartDates.join(), 'Scrapers must be ordered by startDate')

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
      const { type, data, url, timeout } = crawler

      // Crawl type
      requirement(allowed.some(a => a === type), datedError(
        `Invalid crawler.type '${type}'; must be one of: page, headless, csv, tsv, pdf, json, raw`
      ))

      // Crawl data (format) type, for ranking
      if (data) {
        requirement(is.string(data), datedError('Crawler data must be a string'))
        const allowedData = [ 'table', 'list', 'paragraph' ]
        requirement(allowedData.some(a => a === data), datedError(
          `Invalid crawler.data '${data}'; must be one of: ${allowedData.join(', ')}`
        ))
      }

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

module.exports = {
  validateSource
}
