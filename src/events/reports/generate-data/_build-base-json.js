const arc = require('@architect/functions')
const getSource = require('@architect/shared/sources/_lib/get-source.js')
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

function addPopulationDensity (rec) {
  if (rec.population && rec.area && rec.area.landSquareMeters) {
    const pd = (rec.population / rec.area.landSquareMeters) * 1000000
    rec.populationDensity = Math.round(pd * 10000) / 10000
  }
}

/** Given array of hashes, gets unique elements, where uniquness is
 * determined by key value. */
function uniqueByKey (arr, key) {
  const h = arr.reduce((hsh, m) => { return { ...hsh, [m[key]]: m } }, {})
  return Object.values(h)
}

/** Gets base json to be interpreted and formatted by all reports.
 *
 * Pass in params._sourcesPath to override the default sources path. */
async function getBaseJson (params) {
  const data = await arc.tables()
  const locations = await data.locations.scan({}).
        then(result => result.Items).
        then(result => result.sort((a, b) => a.locationID < b.locationID ? -1 : 1))
  const result = []
  for (var i = 0; i < locations.length; ++i) {
    const loc = locations[i]
    addPopulationDensity(loc)
    const ts = await getTimeseriesForLocation(data, loc.locationID)
    const sources = ts.sources.map(s => getSource({ source: s, ...params }))
    const maintainers = uniqueByKey(sources.map(s => s.maintainers).flat(), 'name')
    const links = uniqueByKey(sources.map(s => s.friendly).flat(), 'url')

    result.push( { ...loc, maintainers, links, ...ts } )
  }
  return result
}


module.exports = getBaseJson
