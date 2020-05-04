const { brotliCompressSync } = require('zlib')
const arc = require('@architect/functions')
const validate = require('./_validate.js')
const chromium = require('chrome-aws-lambda')

async function getHeadless (req) {
  let options = decodeURIComponent(req.queryStringParameters.options)
  options = JSON.parse(options)
  let { cookies, rejectUnauthorized, url, timeout=5000 } = options

  let browser = null

  try {
    const agent = 'Mozilla/5.0 (Macintosh Intel Mac OS X 10_13_2) ' +
                  'AppleWebKit/537.36 (KHTML, like Gecko) ' +
                  'Chrome/80.0.3987.132 Safari/537.36'
    const defaultViewport = { width: 1280, height: 800, isMobile: false }

    // Important: this prevents SSL from failing
    if (rejectUnauthorized) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    // Local env uses regular puppeteer
    if (process.env.CI || process.env.NODE_ENV === 'testing') {
      // eslint-disable-next-line
      const puppeteer = require('puppeteer')
      browser = await puppeteer.launch()
    }
    // Production uses the Lambda build
    else {
      browser = await chromium.puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
      })
    }

    let page = await browser.newPage()

    await page.setUserAgent(agent)
    await page.setViewport(defaultViewport)
    if (cookies) {
      const cookie = Object.entries(cookies).map(([ cookie, value ]) => `${cookie}=${value}`).join('; ')
      await page.setExtraHTTPHeaders({ cookie })
    }

    const response = await page.goto(url, {
      timeout: 30000,
      waitUntil: 'networkidle2'
    })

    const status = response && response.status()
    const ok = `${status}`.startsWith(2)

    // We got a good response, return it
    if (ok) {
      await page.waitFor(timeout)
      const html = await page.content()
      browser.close()

      // Compress, then base64 encode body in case we transit binaries, max 10MB payload
      let responseBody = Buffer.from(html)
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
      // TODO handle cookies, haven't seen a need yet
      // → page.cookies

      const body = JSON.stringify(payload)
      return {
        statusCode: 200,
        body
      }
    }
    else {
      return {
        statusCode: status || 599 // Kinda? But 599 it's weird and noticeable
      }
    }
  }
  catch (err) {
    if (browser) {
      browser.close()
    }
    console.error('Some manner of strange error occurred:', err)
    console.log('Params:', JSON.stringify(options, null, 2))
    return {
      statusCode: 500,
      json: { error: err.stack }
    }
  }
}

exports.handler = arc.http.async(validate, getHeadless)
