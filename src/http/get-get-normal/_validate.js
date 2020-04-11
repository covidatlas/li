module.exports = function validate (req) {
  try {
    // TODO add security here to prevent invocations from external actors
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
