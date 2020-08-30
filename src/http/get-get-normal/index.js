const { brotliCompressSync } = require('zlib')
const arc = require('@architect/functions')
const validate = require('./_validate.js')
const got = require('got')

/** Don't cache anything this lambda returns. */
const responseHeaders = {
  'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
}


/** Standard struct to return if get fails. */
function failureResponse (statusCode, msg) {
  return {
    statusCode,
    json: { error: msg },
    headers: responseHeaders
  }
}


async function getNormal (req) {
  let options = decodeURIComponent(req.queryStringParameters.options)
  options = JSON.parse(options)

  let { cookies, url, headers } = options

  /** Setup request headers. */
  const requestHeaders = headers || {}
  requestHeaders['user-agent'] = 'Mozilla/5.0 (Macintosh Intel Mac OS X 10_13_2) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/80.0.3987.132 Safari/537.36'
  if (cookies) {
    const ch = Object.entries(cookies).
          map(([ cookie, value ]) => `${cookie}=${value}`).
          join('; ')
    requestHeaders.cookie = ch
  }

  /** Hack SSL. */
  const sslDefaults = {
    rejectUnauthorized: true,
    disableSSL: false
  }
  const sslOptions = Object.assign(sslDefaults, options.options)
  if (!sslOptions.rejectUnauthorized || sslOptions.disableSSL) {
    console.log('disabling ssl')
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  /** Setup got. */
  const gotParams = {
    headers: requestHeaders,
    // 4 min got timeout.  Overall lambda timeout is in .arc-config
    timeout: 4 * 60 * 1000,
    retry: 0,
    // Throwing deprives us of raw error codes, which we want!
    throwHttpErrors: false,
    // Repeating defaults jic
    isStream: false,
    encoding: 'utf8'
  }
  // if (options.options && options.options.timeout) {
  //   console.log('override timeout')
  //   gotParams.timeout = options.options.timeout
  // }


  // got appears to auto-guess the response type, and with xlsx
  // files it was assuming an incorrect stream type, resulting in
  // mutated data.
  // ref https://github.com/sindresorhus/got/issues/4
  // Thanks very much to Ryan Block for sorting this out!
  if ((options.type === 'xlsx') ||
      (options.options && options.options.useBuffer))
    gotParams.responseType = 'buffer'

  try {
    // See comment in `src/shared/sources/_lib/arcgis.js` ... this is
    // required for this lambda to be successfully called from
    // `crawler/crawler/index.js`.
    url = url.replace(/-QUOTE-/g, '"')
    const response = await got(url, gotParams)

    /** Process response. */
    const status = response.statusCode
    const is2xx = `${status}`.startsWith(2)

    // Quick exit if bad response.  Note we've sometimes seen 200
    // status with empty body (due to some problem with the request
    // headers), so need to check both.
    const hasBody = (response.body !== null && response.body !== undefined)
    if (!is2xx || !hasBody) {
      return failureResponse(
        is2xx ? 500 : status || 599,
        `original status: ${status}; has body: ${hasBody}`
      )
    }

    // Compress, then base64 encode body in case we transit binaries
    const payload = {
      body: brotliCompressSync(Buffer.from(response.body)).toString('base64')
    }

    // Length check due to max Lambda payload.
    const maxPayload = 1000 * 1000 * 10
    const len = payload.body.length
    if (len >= maxPayload) {
      return failureResponse(500, `max payload exceeded (${len} > ${maxPayload})`)
    }

    // Pass cookies back to crawler client.
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

    return {
      statusCode: 200,
      body: JSON.stringify(payload),
      headers: responseHeaders
    }

  }
  catch (err) {
    console.error('Failure:', err)
    console.log('Params:', JSON.stringify(options, null, 2))
    return failureResponse(500, err.stack)
  }
}

exports.handler = arc.http.async(validate, getNormal)
