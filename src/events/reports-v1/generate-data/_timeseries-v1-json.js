/** Build covidatlas.com-compliant timeseries.json from
 * baseData.json. */

const assert = require('assert')

/** Return { min: min-date, max: max-date }. */
function _minMaxDatesAcrossAllLocations (baseData) {
  return baseData.reduce((hsh, loc) => {
    const dates = Object.keys(loc.dates || {}).sort()
    if (dates.length !== 0) {
      const min = dates[0]
      const max = dates.slice(-1)[0]
      if (hsh.min > min)
        hsh.min = min
      if (hsh.max < max)
        hsh.max = max
    }
    return hsh
  }, { min: '9999-99-99', max: '0000-00-00' })
}

/** Return fully populated date range, given min-max dates. */
function _dateRange (minYYYYMMDD, maxYYYYMMDD) {
  assert(minYYYYMMDD <= maxYYYYMMDD, `start ${minYYYYMMDD} <= end ${maxYYYYMMDD}`)

  const firstDate = new Date(minYYYYMMDD)
  const lastDate = new Date(maxYYYYMMDD)
  let dateRange = []
  const nextDay = (i) => { return new Date(i.getFullYear(), i.getMonth(), i.getDate() + 1) }
  for (let i = firstDate; i <= lastDate; i = nextDay(i)) {
    dateRange.push(i.toISOString().split('T')[0])
  }
  return dateRange
}

/** Build timeseries.json. */
function buildTimeseriesV1Report (baseData) {
  const minMaxDates = _minMaxDatesAcrossAllLocations(baseData)
  const dates = _dateRange(minMaxDates.min, minMaxDates.max)
  const result = dates.reduce((h, dt) => { h[dt]={}; return h }, {})
  baseData.forEach((loc, index) => {
    const locDates = Object.keys(loc.dates || {})
    locDates.forEach(dt => result[dt][`${index}`] = loc.dates[dt])
  })
  return result
}

module.exports = buildTimeseriesV1Report
