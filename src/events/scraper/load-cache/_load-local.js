const fs = require('fs')
const { join } = require('path')
const { gunzipSync } = require('zlib')
const sorter = require('@architect/shared/utils/sorter.js')
const datetime = require('@architect/shared/datetime/index.js')
const getDateBounds = require('./_get-date-bounds.js')
const getLocalDateFromFilename = require('./_get-local-date-from-filename.js')

module.exports = async function loadLocal (params) {
  let { source, scraper, date, tz } = params
  const { _sourceKey, timeseries } = source

  const cachePath = join(__dirname, '..', '..', '..', '..', 'crawler-cache', _sourceKey)

  if (!fs.existsSync(cachePath)) {
    // TODO add local cache downloading here
    return
  }

  let folders = fs.readdirSync(cachePath)

  /**
   * All cache data is saved with a 8601Z timestamp
   *   In order to match the date requested to the timestamp, we must re-cast it to the locale in question
   */
  if (folders.length) {
    // Sort from earliest to latest
    folders = sorter(folders)

    /**
     * Gather yesterday (UTC+), today, and tomorrow (UTC-)
     */
    let files = []
    let d = timeseries ? datetime.today.at(tz) : date
    let today = folders.findIndex(f => f === d)
    // Fresh cache, and maybe behind the UTC tomorrow
    if (today === -1) today = folders.findIndex(f => f === datetime.getYYYYMMDD())
    const cacheDirs = [today - 1, today, today + 1]
    for (const cacheDir of cacheDirs) {
      try {
        const result = fs.readdirSync(join(cachePath, folders[cacheDir]))
        files = files.concat(result)
        // eslint-disable-next-line
      } catch (err) { /* noop */ }
    }

    if (!timeseries) {
      /**
       * If date is earlier than we have cached, bail
       */
      const { earliest, latest } = getDateBounds(files, tz)
      if (datetime.dateIsBefore(date, earliest)) {
        console.error('Sorry McFly, we need more gigawatts to go back in time')
        throw Error(`Date requested (${date}) is before our earliest cache ${earliest}`)
      }

      // Fix this soon: it won't work until we can cast the requested date to today for the locale in question, otherwise we'll get false positives on future
      if (datetime.dateIsAfter(date, latest)) {
        console.error('Sorry, without increasing gravity we cannot speed up time to get this data')
        throw Error(`Date requested (${date}) is after our latest cache ${latest}`)
      }

      // Filter files that match date when locale-cast from UTC
      files = files.filter(filename => {
        const castDate = getLocalDateFromFilename(filename, tz)
        return castDate === date
      })
    }

    if (!files.length) {
      const msg = timeseries
        ? 'No cached files for this timeseries'
        : `No cached files found for ${date}`
      throw Error(msg)
    }

    let cache = []
    for (const crawl of scraper.crawl) {
      // We may have multiple crawls for a single scraper (each with a unique name key)
      // Disambiguate and match them so we are getting back the correct data sources
      const { name='default' } = crawl
      const matchName = file => name === file.split('-')[3] // Skips over 8601Z ts
      const matches = files.filter(matchName)
      if (!matches.length) {
        // TODO add local cache downloading here
        return
      }

      // We may have multiple files for this day, choose the last one
      // TODO we may want to do more here, including:
      // - analysis of contents (e.g. stale files, etc.)
      // - attempting to scrape this file, and if it doesn't work, trying a previous scrape from the same day?
      const file = matches[matches.length - 1]
      const dir = file.substr(0, 10)
      const filePath = join(cachePath, dir, file)

      if (fs.existsSync(filePath)) {
        const file = fs.readFileSync(filePath)
        crawl.data = filePath.endsWith('.gz') ? gunzipSync(file) : file
        cache.push(crawl)
      }
      else throw Error('Unknown file cache reading error')
    }

    return cache
  }
  // TODO blow up or fetch cache here
}
