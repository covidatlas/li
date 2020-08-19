const spacetime = require('spacetime')


function throwIfNonDate (d) {
  if (!d)
    throw new Error('null or undefined date')
  const dateRe  = /\d{4}-\d{2}-\d{2}/
  if (!d.match(dateRe))
    throw new Error(`date '${d}', does not match regex ${dateRe}`)
}

/** Gets an array of dates, with the earliest and the latest as the
 * boundaries.
 *
 * Such a simple function, but js can make it difficult.
 */
module.exports = function getDateRange (earliestYYYYMMDD, latestYYYYMMDD) {

  throwIfNonDate(earliestYYYYMMDD)
  throwIfNonDate(latestYYYYMMDD)

  if (earliestYYYYMMDD > latestYYYYMMDD)
    throw new Error(`${earliestYYYYMMDD} > ${latestYYYYMMDD}`)

  let d = spacetime(earliestYYYYMMDD)
  const latest = spacetime(latestYYYYMMDD)

  let dates = []
  while (!d.isAfter(latest)) {
    dates.push(d.format('YYYY-MM-DD'))
    d = d.add(1, 'day')
  }
  return dates
}
