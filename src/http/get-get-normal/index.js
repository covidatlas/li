const { brotliCompressSync } = require('zlib')
const arc = require('@architect/functions')
const validate = require('./_validate.js')
const got = require('got')

async function getNormal (req) {
  let options = decodeURIComponent(req.queryStringParameters.options)
  options = JSON.parse(options)
  let { cookies, rejectUnauthorized, url } = options

  try {
    const agent = 'Mozilla/5.0 (Macintosh Intel Mac OS X 10_13_2) ' +
                  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/80.0.3987.132 Safari/537.36'
    const timeout = 30000

    // Important: this prevents SSL from failing
    if (rejectUnauthorized) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    let headers = {
      'user-agent': agent
    }

    // Reconstitute cookies
    if (cookies) {
      let cookie = Object.entries(cookies).map(([cookie, value]) => `${cookie}=${value}`).join('; ')
      headers.cookie = cookie
    }

    const response = await got(url, {
      headers,
      timeout,
      retry: 0,
      // Throwing deprives us of raw error codes, which we want!
      throwHttpErrors: false,
      // Repeating defaults jic
      isStream: false,
      encoding: 'utf8'
    })

    const status = response.statusCode
    const ok = `${status}`.startsWith(2)

    // We presumably got a good response, return it
    if (ok) {
      // Compress, then base64 encode body in case we transit binaries, max 10MB payload
      let responseBody = new Buffer.from(response.body)
      responseBody = brotliCompressSync(responseBody).toString('base64')
      if (responseBody.length >= 1000 * 1000 * 10) {
        console.log(`Hit a very large payload!`, JSON.stringify(options, null, 2))
        return {
          statusCode: 500,
          json: { error: 'maximum_size_exceeded' }
        }
      }
      // Set up response payload
      let payload = {
        body: responseBody
      }

      // Handle cookies in case a crawler client needs them
      const responseCookies = response.headers && response.headers['set-cookie']
      const hasCookies = Array.isArray(responseCookies) && responseCookies.length
      if (hasCookies) {
        const cookies = {}
        for (const cookie of responseCookies) {
          const nibble = cookie.split(';')[0]
          const crumbs = nibble.split('=')
          cookies[crumbs[0]] = crumbs[1]
        }
        payload.cookies = cookies
      }

      const body = JSON.stringify(payload)
      return {
        statusCode: 200,
        body
      }
    }
    else {
      return {
        statusCode: status
      }
    }
  }
  catch (err) {
    console.error('Some manner of strange error occurred:', err)
    console.log('Params:', JSON.stringify(options, null, 2))
    return {
      statusCode: 500,
      json: { error: err.stack }
    }
  }
}

exports.handler = arc.http.async(validate, getNormal)
