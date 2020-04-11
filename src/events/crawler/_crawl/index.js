const got = require('got')

module.exports = async function crawl (params) {
  const { type, url, rejectUnauthorized } = params
  const getType = type !== 'headless' ? 'normal' : 'headless'
  const isLocal = process.env.NODE_ENV === 'testing' || process.env.ARC_LOCAL

  let options = JSON.stringify({ type, url, rejectUnauthorized })
  options = encodeURIComponent(options)

  try {
    const root = isLocal
      ? `http://localhost:${process.env.PORT || 3333}`
      : `http://localhost:${process.env.PORT || 3333}` // FIXME change to prod url
    const path = `${root}/get/${getType}?options=${options}`
    return await got(path)
  }
  catch (err) {
    console.log('Crawler error', err)
    throw Error(err)
  }
}
