const sorter = require('@architect/shared/utils/sorter.js')
const datetime = require('@architect/shared/datetime/index.js')
const getDateBounds = require('./_get-date-bounds.js')
const getLocalDateFromFilename = require('./_get-local-date-from-filename.js')

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

    // Gets all eligible files for source
    let { keys, files } = await loader.getFiles({
      _sourceKey,
      date,
      folders,
      timeseries,
      tz
    })

    if (!timeseries && files.length) {
      /**
       * If date is earlier than we have cached, bail
       */
      const { earliest, latest } = getDateBounds(files, tz)
      if (datetime.dateIsBefore(date, earliest) && useS3) {
        console.error('Sorry McFly, we need more gigawatts to go back in time')
        throw Error(`DATE_BOUNDS_ERROR: Date requested (${date}) is before our earliest cache ${earliest}`)
      }

      if (datetime.dateIsAfter(date, latest) && useS3) {
        console.error('Sorry, without increasing gravity we cannot speed up time to get this data')
        throw Error(`DATE_BOUNDS_ERROR: Date requested (${date}) is after our latest cache ${latest}`)
      }

      // Filter files that match date when locale-cast from UTC
      files = files.filter(filename => {
        const castDate = getLocalDateFromFilename(filename, tz)
        return castDate === date
      })
    }

    if (!files.length && useS3) {
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

      // Fall back to S3 cache
      if (!matches.length) {
        cache = 'miss'
        break
      }

      // We may have multiple files for this day, choose the last one
      // TODO we may want to do more here, including:
      // - analysis of contents (e.g. stale files, etc.)
      // - attempting to scrape this file, and if it doesn't work, trying a previous scrape from the same day?
      const file = matches[matches.length - 1]

      crawl.content = await loader.getFileContents({ _sourceKey, keys, file })
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
