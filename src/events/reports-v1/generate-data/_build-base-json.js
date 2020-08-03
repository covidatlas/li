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

function addLatLong (rec) {
  if (rec.coordinates) {
    rec.lat = rec.coordinates[1]
    rec['long'] = rec.coordinates[0]
  }
}

/** Given array of hashes, gets unique elements, where uniquness is
 * determined by key value. */
function uniqueByKey (arr, key) {
  const h = arr.
        filter(p => p).
        reduce((hsh, m) => { return { ...hsh, [m[key]]: m } }, {})
  return Object.values(h)
}


/**
 * Get all locations, paginated scan.
 */
async function getAllLocations (data) {
  console.log('getting all locations')
  // Iterative recursion.
  async function get (startKey = null, items = []) {
    const params = {}
    if (startKey)
      params.ExclusiveStartKey = startKey
    const r = await data.locations.scan(params)

    items = items.concat(r.Items)
    console.log(`params ${JSON.stringify(params)} got ${r.Items.length} locations`)

    if (r.LastEvaluatedKey)
      return await get(r.LastEvaluatedKey, items)

    console.log(`total ${items.length} locations`)
    return items
  }

  return await get()
}


/** Run asyncFunction array, poolSize at a time. */
async function asyncPool (array, poolSize, onExit = () => {}) {
  const result = []
  const pool = []

  // Promises leave the pool when they're resolved.
  function leavePool (e) { pool.splice(pool.indexOf(e), 1) }

  for (const item of array) {
    const p = Promise.resolve(item())
    result.push(p)
    const e = p.then(() => { leavePool(e); onExit() })
    pool.push(e)
    if (pool.length >= poolSize)
      await Promise.race(pool)
  }
  return Promise.all(result).then(r => r.flat())
}


/** Each location has timeseries data.  From that, we derive other
 * data.  This is separated from timeseries loading as it is
 * cpu-bound, whereas timeseries loading is i/o bound (gathered in
 * dynamoDB calls). */
function addDerivedData (loc, params) {
  delete loc.created
  delete loc.updated
  addPopulationDensity(loc)
  addLatLong(loc)
  const sources = loc.sources.map(s => getSource({ source: s, ...params }))
  const maintainers = uniqueByKey(sources.map(s => s.maintainers).flat(), 'name')
  const links = uniqueByKey(sources.map(s => s.friendly).flat(), 'url')
  return { ...loc, maintainers, links }
}


/** Dummy function for status updates. */
// eslint-disable-next-line no-unused-vars
async function baseJsonStatus (index, total) {}


/** Gets base json to be interpreted and formatted by all reports.
 *
 * Pass in params._sourcesPath to override the default sources path. */
async function getBaseJson (params, statusCallback = baseJsonStatus) {
  const data = await arc.tables()
  const locations = await getAllLocations(data).
        then(result => result.sort((a, b) => a.locationID < b.locationID ? -1 : 1))

  let n = 0
  const onExit = () => {
    statusCallback(n, locations.length)
    n += 1
  }

  // Timeseries data is loaded via an async pool, b/c each load calls
  // dynamoDB (i/o bound).
  const promises = locations.map(loc => {
    return async () => {
      const ts = await getTimeseriesForLocation(data, loc.locationID)
      return { ...loc, ...ts }
    }
  })

  // Load the rest of the derived data.
  const result = await asyncPool(promises, 100, onExit).
        then(locs => locs.map(loc => addDerivedData(loc, params)))
  return result
}


module.exports = getBaseJson
