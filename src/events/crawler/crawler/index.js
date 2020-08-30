const { brotliDecompressSync } = require('zlib')
const got = require('got')

async function crawl (type, params) {
  const getType = type !== 'headless' ? 'normal' : 'headless'
  const isLocal = process.env.NODE_ENV === 'testing' || process.env.ARC_LOCAL
  const isStaging = process.env.NODE_ENV === 'staging'

  let options = JSON.stringify(Object.assign(params, { type }))
  options = encodeURIComponent(options)

  const root = isLocal
    ? `http://localhost:${process.env.PORT || 3333}`
    : `https://api.${isStaging ? 'staging.' : ''}covidatlas.com`
  const path = `${root}/get/${getType}?options=${options}`
  const crawlToken = process.env.CRAWL_TOKEN ? process.env.CRAWL_TOKEN : '' // Don't break the buffer
  const token = Buffer.from(crawlToken).toString('base64')
  const headers = { authorization: `Bearer ${token}` }
  const result = await got(path, {
    retry: 0,
    throwHttpErrors: false,
    headers
  })
  const { statusCode, body } = result

  if (statusCode === 200) {
    let response = JSON.parse(body)
    if (response.body) {
      response.body = Buffer.from(response.body, 'base64')
      response.body = brotliDecompressSync(response.body)
    }
    return response
  }
  else {
    const error = [
      `Crawl returned status code: ${statusCode}`,
      `Type: ${type} (${getType})`,
      `Params: ${JSON.stringify(params, null, 2)}`
    ]
    if (body) {
      error.push(`Getter body: ${body}`)
      const response = JSON.parse(body)
      error.push(`Getter error: ${response.error}`)
    }
    console.log('ERROR:')
    console.log(error.join('\n'))
    throw Error(error.join('\n'))
  }
}


/** Async client passed to crawl.url functions.
 *
 * Samples:

    // Get the final URL to call from a "table of contents" page.
    url: async (client) => {
      const { body } = await client({ url: 'some-url.html' })
      const regex = new RegExp(`statistics<\/title><link>(?<url>[a-zA-Z\/.:_]+<\/link>`)
      const matches = body.match(regex)
      const url = matches && matches.groups && matches.groups.url
      assert(url, `no url found for date: ${localDate}`)
      return { url }
    }


    // Get first matching link in list of links.
    url: async client => {
      const indexPage = 'https://coronavirus.dc.gov/page/coronavirus-data'
      const { body } = await client({ url: indexPage })
      linkRe = /href="(?<relpath>.*?)"/g
      const matches = Array.from(body.matchAll(linkRe))
      const xlsxLinks = matches.
            map(m => m.groups.relpath).
            filter(r => r.match(/xlsx$/))
      return { url: xlsxLinks[0] }
    }

 */
async function client (params) {
  let response = await crawl('normal', params)
  // As a convenience, convert the client's body back to a string since we aren't piping to cache
  if (response.body) response.body = response.body.toString()
  return response
}

crawl.client = client

module.exports = crawl
