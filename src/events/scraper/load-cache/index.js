const sorter = require('@architect/shared/utils/sorter.js')
const datetime = require('@architect/shared/datetime/index.js')
const getDateBounds = require('./_get-date-bounds.js')
const getLocalDateFromFilename = require('./_get-local-date-from-filename.js')
const parseCacheFilename = require('@architect/shared/utils/parse-cache-filename.js')

const local = require('./_load-local.js')
const s3 = require('./_load-s3.js')

const isLocal = process.env.NODE_ENV === 'testing'

/** Throws if the cache doesn't have files matching the locale-cast date. */
function validateDateBounds (files, date, tz) {
  const { earliest, latest } = getDateBounds(files, tz)
  if (datetime.dateIsBefore(date, earliest)) {
    throw Error(`DATE_BOUNDS_ERROR: Date requested (${date}) is before our earliest cache ${earliest}`)
  }

  if (datetime.dateIsAfter(date, latest)) {
    throw Error(`DATE_BOUNDS_ERROR: Date requested (${date}) is after our latest cache ${latest}`)
  }
}

/**
 * Cache loader
 * Pulls data from local cache dir or S3, depending on environment and needs.
 * Returns null if cache misses.
 */
async function load (params, loader, loaderName) {
  let { source, scraper, date, tz } = params
  const { _sourceKey, timeseries } = source

  let folders = await loader.getFolders(_sourceKey)

  if (!folders.length)
    return null

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

  files = [ ...new Set(files) ]  // Remove duplicates.

  // All cache data is saved with a 8601Z timestamp.  In order to match
  // the date requested to the timestamp, we must re-cast it to the
  // locale in question
  if (!timeseries && files.length) {
    validateDateBounds(files, date, tz)
    const filenameDateEqualsDate = f => (getLocalDateFromFilename(f, tz) === date)
    files = files.filter(filenameDateEqualsDate)
  }

  if (!files.length)
    return null

  let cache = []
  for (const crawl of scraper.crawl) {
    // We may have multiple crawls for a single scraper (each with a unique name key)
    // Disambiguate and match them so we are getting back the correct data sources
    const { name='default', paginated } = crawl

    const matches = parseCacheFilename.matchName(name, files)

    if (!matches.length)
      return null

    // We may have multiple files for this day, choose the last one
    const file = matches[matches.length - 1]

    let fileset = [ file ]
    if (paginated)
      fileset = parseCacheFilename.matchPaginatedSet(file, files)

    // Copy crawl so we don't accidentally mutate anything.
    const result = Object.assign({}, crawl)
    const allContent = fileset.map(file => loader.getFileContents({ _sourceKey, keys, file }))
    result.pages = await Promise.all(allContent)
    cache.push(result)
  }

  console.log(`${loaderName} cache hit for: ${_sourceKey} / ${date}`)
  return cache
}

async function loadCache (params) {
  let result
  const attemptedSources = []

  // Try loading locally if testing.
  if (isLocal) {
    attemptedSources.push('local')
    try {
      result = await load(params, local, 'Local')
      if (result)
        return result
      console.log('Local cache miss, attempting to pull cache from S3')
    } catch (err) {
      console.log('Local cache fail, attempting to pull cache from S3')
    }
  }

  // Load s3, throw errors back to caller.
  attemptedSources.push('S3')
  result = await load(params, s3, 'S3')
  // TODO (s3) Save downloaded stuff locally.
  if (result) {
    return result
  }

  const msg = `Could not load cache; cache not available in ${attemptedSources.join(' or ')}`
  throw new Error(msg)
}

module.exports = loadCache
