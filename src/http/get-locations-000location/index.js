const arc = require('@architect/functions')
const sorter = require('@architect/shared/utils/sorter.js')

async function getLocation (req) {
  const headers = {
    // Perhaps allow this to be edge cached for some small interval of time?
    'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
  }
  try {
    const data = await arc.tables()
    const slug = req.pathParameters.location
    const result = await data.locations.get({ slug })

    if (!result) {
      return {
        statusCode: 404,
        json: { ok: false },
        headers
      }
    }

    // Query the location data
    // TODO paginate query
    const rawCaseData = await data['case-data'].query({
      TableName: 'locations',
      IndexName: 'locationID-index',
      KeyConditionExpression: 'locationID = :locationID',
      ExpressionAttributeValues: { ':locationID': result.locationID }
    })

    // Present data from a primary source
    // TODO we really need to get our data deduping sorted here
    const filteredCaseData = rawCaseData.Items.filter(i => i.priority >= 0 || i.priority === undefined)

    // Extract what we need to respond
    let caseData = filteredCaseData.map(i => {
      // TODO determine the rest of the data we want to return here
      const { cases, date, deaths, recovered, updated } = i
      return { cases, date, deaths, recovered, updated }
    })

    // Return data reverse chronologically
    caseData = sorter.objects(caseData).reverse()
    return {
      json: caseData,
      headers
    }
  }
  catch (err) {
    console.log(err)
    return {
      statusCode: 500,
      headers
    }
  }
}

exports.handler = arc.http.async(getLocation)
