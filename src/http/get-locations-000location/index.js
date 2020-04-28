const arc = require('@architect/functions')
const sorter = require('@architect/shared/utils/sorter.js')

async function getLocation (req) {
  try {
    const data = await arc.tables()
    const name = req.pathParameters.location
    const result = await data.locations.get({ name })
    if (!result) {
      return {
        statusCode: 404,
        json: { ok: false }
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

    // TODO add deduping / priority
    let caseData = rawCaseData.Items.map(i => {
      // TODO determine the rest of the data we want to return here
      const { cases, date, deaths, recovered, updated } = i
      return { cases, date, deaths, recovered, updated }
    })

    // Return data reverse chronologically
    caseData = sorter.objects(caseData).reverse()
    return {
      json: caseData
    }
  }
  catch (err) {
    console.log(err)
    return {
      statusCode: 500
    }
  }
}

exports.handler = arc.http.async(getLocation)
