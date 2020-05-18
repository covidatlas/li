const assert = require('assert')
const sorter = require('@architect/shared/utils/sorter.js')
const datetime = require('@architect/shared/datetime/index.js')
const getDateBounds = require('./_get-date-bounds.js')
const getLocalDateFromFolder = require('./_get-local-date-from-folder.js')

const local = require('./_load-local.js')
const s3 = require('./_load-s3.js')

const isLocal = process.env.NODE_ENV === 'testing'

/**
 * Cache loader
 * Pulls data from local cache dir or S3, depending on environment and needs
 */
async function load (params, useS3) {
  let { source, scraper, date, tz } = params
  const { _sourceKey, timeseries } = source

  if (!isLocal) useS3 = true // Force S3 in production
  const loader = useS3 ? s3 : local

  let folders = await loader.getFolders(_sourceKey)

  /**
   * All cache data is saved with a 8601Z timestamp
   *   In order to match the date requested to the timestamp, we must re-cast it to the locale in question
   */
  if (folders.length) {
    // Sort from earliest to latest
    folders = sorter(folders)

    // Gets all eligible folders for source
    let timefolders = await loader.getTimeFolders({ _sourceKey, folders })

    if (!timeseries && timefolders.length) {
      /**
       * If date is earlier than we have cached, bail
       */
      const { earliest, latest } = getDateBounds(timefolders, tz)

      if (datetime.dateIsBefore(date, earliest) && useS3) {
        console.error('Sorry McFly, we need more gigawatts to go back in time')
        throw Error(`DATE_BOUNDS_ERROR: Date requested (${date}) is before our earliest cache ${earliest}`)
      }

      if (datetime.dateIsAfter(date, latest) && useS3) {
        console.error('Sorry, without increasing gravity we cannot speed up time to get this data')
        throw Error(`DATE_BOUNDS_ERROR: Date requested (${date}) is after our latest cache ${latest}`)
      }

      // Filter folders that match date when locale-cast from UTC
      timefolders = timefolders.filter(f => {
        const castDate = getLocalDateFromFolder(f, tz)
        return castDate === date
      })
    }

    if (!timefolders.length && useS3) {
      const msg = timeseries
        ? 'No cached files for this timeseries'
        : `No cached files found for ${date}`
      throw Error(msg)
    }

    // Use the latest timefolder
    const useTimefolder = timefolders[timefolders.length - 1]
    const files = await loader.getFiles({ _sourceKey, folder: useTimefolder })

    let cache = []
    for (const crawl of scraper.crawl) {
      // We may have multiple crawls for a single scraper (each with a unique name key)
      // Disambiguate and match them so we are getting back the correct data sources
      const { name='default' } = crawl

      // File name is, e.g., default-99fd8.json.gz, so only get the name part.
      const matchName = file => name === file.split('-')[0]
      const matches = files.filter(matchName)

      // Fall back to S3 cache
      if (!matches.length) {
        cache = 'miss'
        break
      }

      // TODO: will need to fix this for pagination.
      assert.equal(matches.length, 1, `exactly one match for crawl name '${name}'`)

      // TODO we may want to do more here, including:
      // - analysis of contents (e.g. stale files, etc.)
      // - attempting to scrape this file, and if it doesn't work, trying a previous scrape from the same day?
      const file = matches[0]

      crawl.content = await loader.getFileContents({ _sourceKey, folder: useTimefolder, file })
      cache.push(crawl)
    }
    if (cache !== 'miss') {
      console.log(`${useS3 ? 'S3' : 'Local'} cache hit for: ${_sourceKey} / ${date}`)
      return cache
    }
  }
  return false
}

async function loadCache (params) {
  let result = await load(params)
  if (result) {
    return result
  }
  // Only try a second time if loading locally didn't work
  // Force calling to S3 for cache if it isn't available locally
  else if (isLocal) {
    console.log('Local cache miss, attempting to pull cache from S3')
    result = await load(params, true)
    if (result) {
      return result
    }
  }
  throw Error('Could not load cache; cache not available locally or in S3')
}

module.exports = loadCache
