// TODO (data) validate the fields that we want to include
// TODO (data) extract these fields as a common constant, and use everywhere
const reportFields = [
  'cases',
  'deaths',
  'hospitalized',
  'icu',
  'recovered',
  'tested',
]

function _includeFields (obj, keys) {
  return keys.
    map(k => k in obj ? { [k]: obj[k] } : {}).
    reduce((hsh, entry) => Object.assign(hsh, entry), {})
}

function _timeseriesForLocation (locationID, records) {
  const locRecords = records.filter(rec => rec.locationID === locationID)
  const dates = [ ...new Set(locRecords.map(rec => rec.date)) ]
  return dates.reduce((hsh, d) => {
    const recs = locRecords.filter(lr => lr.date === d)
    hsh[d] = _includeFields(recs[0], reportFields)
    return hsh
  }, {})
}

function buildTimeseries (records) {
  const locationIDs = [ ...new Set(records.map(r => r.locationID)) ].sort()
  return locationIDs.map(locationID => {
    return {
      locationID,
      timeseries: _timeseriesForLocation(locationID, records)
    }
  })
}

module.exports = buildTimeseries
