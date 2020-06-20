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

function _validateRecords (records) {

  const minimalRecordSample = {
    locationID: 'someID',
    date: '2020-06-19',
    source: 'someName'
    // priority and case data are optional!
  }
  const requiredKeys = Object.keys(minimalRecordSample)

  function missingRequiredKeys (rec) {
    const keys = Object.keys(rec)
    return requiredKeys.some(f => !keys.includes(f))
  }
  const badRecords = records.filter(missingRequiredKeys)

  if (badRecords.length > 0) {
    const ex = JSON.stringify(badRecords[0])
    const msg = `${badRecords.length} records missing one or more fields ${requiredKeys.join(', ')} (e.g. ${ex})`
    throw new Error(msg)
  }
}

function buildTimeseries (records) {
  _validateRecords (records)
  const locationIDs = [ ...new Set(records.map(r => r.locationID)) ].sort()
  return locationIDs.map(locationID => {
    return {
      locationID,
      timeseries: _timeseriesForLocation(locationID, records)
    }
  })
}

module.exports = buildTimeseries
