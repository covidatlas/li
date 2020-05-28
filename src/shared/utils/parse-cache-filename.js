/**
 * The cache filename has several significant parse which are referred
 * to during cache load, prior to scraping.
 */
function parse (filename) {
  const re = /^(\d{4}-\d{2}-\d{2}t\d{2}_\d{2}_\d{2}\.\d{3}[Zz])-([a-z]+)(-\d+)?-([a-h0-9]{5})\.([a-z]+)\..*$/

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


module.exports = {
  parse
}
