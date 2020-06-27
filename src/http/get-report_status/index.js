const arc = require('@architect/functions')

async function getJson () {
  const data = await arc.tables()
  return await data['report-status'].scan({}).
    then(result => result.Items).
    then(items => items.sort((a, b) => a.reportSource < b.reportSource ? -1 : 1))
}

async function getReportStatus () {
  const json = await getJson()

  // Default response is json.
  const result = {
    statusCode: 200,
    body: JSON.stringify(json, null, 2),
    headers: {
      'cache-control': 'max-age=300, s-maxage=300'
    }
  }

  return result
}

exports.handler = arc.http.async(getReportStatus)
