module.exports = function validate (req) {
  const isLocal = process.env.NODE_ENV === 'testing' || process.env.ARC_LOCAL
  try {
    if (!isLocal) {
      const auth = req.headers.authorization || req.headers.Authorization // lolhttp
      const token = Buffer.from(auth.substr(7), 'base64').toString()
      if (token !== process.env.CRAWL_TOKEN) throw Error('Auth request failed')
    }

    let options = decodeURIComponent(req.queryStringParameters.options)
    options = JSON.parse(options)
    if (!options.url) {
      return {
        statusCode: 400
      }
    }
    return
  }
  catch (err) {
    return {
      statusCode: 400
    }
  }
}
