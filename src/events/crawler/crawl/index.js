const got = require('got')

module.exports = async function crawl (params) {
  const { type, url, rejectUnauthorized } = params
  const getType = type !== 'headless' ? 'normal' : 'headless'
  const isLocal = process.env.NODE_ENV === 'testing' || process.env.ARC_LOCAL

  let options = JSON.stringify({ type, url, rejectUnauthorized })
  options = encodeURIComponent(options)

  const root = isLocal
    ? `http://localhost:${process.env.PORT || 3333}`
    : `http://localhost:${process.env.PORT || 3333}` // FIXME change to prod url
  const path = `${root}/get/${getType}?options=${options}`
  const result = await got(path)

  if (result.statusCode === 200) {
    return new Buffer.from(result.body, 'base64')
  }
  else {
    const err = result.body && result.body.error || 'Request failed'
    throw Error(err)
  }
}
