const arc = require('@architect/functions')
const buildTimeseries = require('./_build-timeseries.js')


async function getTimeseriesForLocation (data, locationID) {
  // Probably should not require pagination as we should only be
  // querying out a few rows tops (a single query operation can
  // retrieve a maximum of 1 MB of data).
  const q = {
    KeyConditionExpression: 'locationID = :locationID',
    ExpressionAttributeValues: {
      ':locationID': locationID
    }
  }
  return data['case-data'].query(q).
    then(result => result.Items).
    then(buildTimeseries).
    then(data => data[locationID])
}


/** Gets the first and last dates in the locations. */
async function getBaseJson () {
  const data = await arc.tables()
  const locations = await data.locations.scan({}).
        then(result => result.Items)

  const result = []
  for (var i = 0; i < locations.length; ++i) {
    const loc = locations[i]
    const ts = await getTimeseriesForLocation(data, loc.locationID)
    result.push( { ...loc, ...ts } )
  }

  return result
}

/** Builds base report json data from dynamoDB data. */
async function buildBaseJson () {
  try {
    return getBaseJson()
  }
  catch (err) {
    console.log(err)
    console.log(err.stack)
    throw err
  }
}

module.exports = {
  buildBaseJson
}
