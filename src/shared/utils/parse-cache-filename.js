const assert = require('assert')

/**
 * The cache filename has several significant parse which are referred
 * to during cache load, prior to scraping.
 */
function parse (filename) {
  const re = /^(\d{4}-\d{2}-\d{2}t\d{2}_\d{2}_\d{2}\.\d{3}z)-([a-z]+)(-\d+)?-([a-h0-9]{5})\.([a-z]+)(\..*)?$/

  if (!re.test(filename)) {
    throw new Error(`Bad cache filename: ${filename}`)
  }
  const m = filename.match(re)

  const parsed = {
    datetime: m[1],
    name: m[2],
    sha: m[4],
    extension: m[5]
  }

  if (m[3])
    parsed.page = parseInt(m[3].replace('-', ''), 10)

  return parsed
}


/** Helper: parse a bunch of filenames, ignoring any bad files. */
function parseFilenames (files) {
  return files.reduce((arr, f) => {
    try {
      const { datetime, name, page } = parse(f)
      arr.push( { filename: f, datetime, name, page: (page || 0) } )
    } catch (err) {
      /* ignore */
    }
    return arr
  }, [])
}

/** Get all files in files that match the given name; for paginated
 * sets, only return the first one. */
function matchName (name, files) {
  const parsed = parseFilenames(files)
  const ret = parsed.filter(p => (p.name === name) && ((p.page || 0) === 0))
  return ret.map(p => p.filename)
}

/** Get all paginated pages that have the same datetime and name. */
function matchPaginatedSet (firstPage, files) {
  const parsed = parseFilenames(files)
  const p = parsed.find(e => e.filename === firstPage)
  assert(p, `Missing filename ${firstPage} in parsed`)
  const pages = parsed.
        filter(f =>
               (f.datetime === p.datetime) &&
               (f.name === p.name) &&
               (f.page !== undefined)
              ).sort((a, b) => a.page - b.page).
        map(f => f.filename)
  console.log(`all pages in set = ${pages.join()}`)
  return pages
}


module.exports = {
  parse,
  matchName,
  matchPaginatedSet
}
