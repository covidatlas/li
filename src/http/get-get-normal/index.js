const arc = require('@architect/functions')
const validate = require('./_validate.js')
const got = require('got')

async function getNormal (req) {
  let options = decodeURIComponent(req.queryStringParameters.options)
  options = JSON.parse(options)
  let { cookie, rejectUnauthorized, url } = options

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
    if (cookie) {
      headers.cookie = cookie
    }

    let tries = 0
    while (tries < 5) {
      tries++
      if (tries > 1) {
        await new Promise(r => setTimeout(r, 2000))
      }

      const response = await got(url, {
        headers,
        timeout,
        retry: 0, // Let this function handle retries
        // Repeating defaults jic
        isStream: false,
        encoding: 'utf8'
      })

      // Some sort of internal socket error or other badness, retry
      if (response === null) {
        continue
      }

      const status = response.statusCode

      // Try again if we got an error code which might be recoverable
      if (status >= 500) {
        continue
      }

      // We got a good response, return it
      if (status < 400) {
        // FIXME add compression here
        // base64 encode body in case we transit binaries, max 10MB payload
        const body = new Buffer.from(response.body).toString('base64')
        if (body.length >= 1000 * 1000 * 10) {
          return {
            statusCode: 500,
            json: { error: 'maximum_size_exceeded' }
          }
        }
        return {
          statusCode: 200,
          body
        }
      }

      // 400-499 means "not found", retrying is not likely to help
      if (status < 500) {
        return {
          statusCode: status
        }
      }

      if (tries === 5) {
        return {
          statusCode: 500
        }
      }
    }
  }
  catch (err) {
    console.error('An error occurred', err)
    return {
      statusCode: 500,
      json: { error: err.stack }
    }
  }
}

exports.handler = arc.http.async(validate, getNormal)
