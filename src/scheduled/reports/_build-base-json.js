const arc = require('@architect/functions')
const getSource = require('@architect/shared/sources/_lib/get-source.js')
const buildTimeseries = require('./_build-timeseries.js')
const utils = require('./_utils.js')

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

function addPopulationDensity (rec) {
  if (rec.population && rec.area && rec.area.landSquareMeters) {
    const pd = (rec.population / rec.area.landSquareMeters) * 1000000
    rec.populationDensity = Math.round(pd * 10000) / 10000
  }
}

/** Gets the first and last dates in the locations.
 *
 * Pass in params._sourcesPath to override the default sources path. */
async function getBaseJson (params) {
  const data = await arc.tables()
  const locations = await data.locations.scan({}).
        then(result => result.Items)

  const result = []
  for (var i = 0; i < locations.length; ++i) {
    const loc = locations[i]
    addPopulationDensity(loc)
    const ts = await getTimeseriesForLocation(data, loc.locationID)

    const sources = ts.sources.map(s => getSource({ source: s, ...params }))
    const maintainers = sources.map(s => s.maintainers).flat()
    // TODO (reports) this won't work if maintainers have the same name.
    loc.maintainers = utils.uniqueByKey(maintainers, 'name')
    const links = sources.map(s => s.friendly).flat()
    loc.links = utils.uniqueByKey(links, 'url')

    result.push( { ...loc, ...ts } )
  }

  return result
}

/** Builds base report json data from dynamoDB data. */
async function buildBaseJson (params) {
  try {
    return getBaseJson(params)
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
