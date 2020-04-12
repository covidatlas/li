const fs = require('fs')
const { join } = require('path')
const sorter = require('./_sorter.js')
const getLocalDateFromFilename = require('./_get-local-date-from-filename.js')

module.exports = async function loadLocal (scraper, _sourceKey, date, tz) {

  if (!date) date = new Date().toISOString().substr(0, 10)

  const cachePath = join(process.cwd(), 'crawler-cache', _sourceKey)

  if (!fs.existsSync(cachePath)) {
    // TODO add local cache downloading here
    return
  }

  let folders = fs.readdirSync(cachePath)

  /**
   * All cache data is saved with a 8601Z timestamp
   *   In order to match the date requested to the timestamp, we must re-cast it to the locale in question
   *   FIXME that can't happen yet, as we need the scrapers to become tz aware
   */
  if (folders.length) {
    // Sort from earliest to latest
    folders = sorter(folders)

    /**
     * Gather yesterday (UTC+), today, and tomorrow (UTC-)
     */
    let files = []
    const today = folders.findIndex(f => f === date)
    const cacheDirs = [today - 1, today, today + 1]
    for (const cacheDir of cacheDirs) {
      try {
        const result = await fs.readdirSync(join(cachePath, folders[cacheDir]))
        files = files.concat(result)
        // eslint-disable-next-line
      } catch (err) { /* noop */ }
    }

    /**
     * If date is earlier than we have cached, bail
     */
    // TODO reimpl
    /*
    const { earliest, latest } = getDateBounds(files)
    if (datetime.dateIsBefore(date, earliest)) {
      log('  ⚠️ Sorry McFly, we cannot go back in time to get %s, no cache present', url)
      return RESOURCE_UNAVAILABLE
    }
    */

    /*
    // Fix this soon: it won't work until we can cast the requested date to today for the locale in question, otherwise we'll get false positives on future
    if (datetime.dateIsAfter(date, latest)) {
      log('  ⚠️ Sorry, %s is in the future without increasing gravity we cannot speed up time to get %s', date, url)
      return RESOURCE_UNAVAILABLE
    }
    */

    // Filter files that match date when locale-cast from UTC
    files = files.filter(filename => {
      const castDate = getLocalDateFromFilename(filename, tz)
      return castDate === date
    })

    if (!files.length) {
      // TODO add local cache downloading here
      return
    }

    let cache = []
    for (const crawl of scraper.crawl) {
      const { name='default' } = crawl
      const matchName = file => name === file.split('-')[3] // Skips over 8601Z ts
      const matches = files.filter(matchName)
      if (!matches.length) {
        // TODO add local cache downloading here
        return
      }

      // We may have multiple files for this day choose the last one
      // TODO we may want to do more here, including:
      // - analysis of contents (e.g. stale files, etc.)
      // - attempting to scrape this file, and if it doesn't work, trying a previous scrape from the same day?
      const file = matches[matches.length - 1]
      const dir = file.substr(0, 10)
      const filePath = join(cachePath, dir, file)

      if (fs.existsSync(filePath)) {
        crawl.data = fs.readFileSync(filePath)
        cache.push(crawl)
      }
      else throw Error('Unknown file cache reading error')
    }

    return cache
  }
}
