const datetime = require('@architect/shared/datetime/index.js')


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
module.exports = function getDatesRange (earliestYYYYMMDD, latestYYYYMMDD) {

  throwIfNonDate(earliestYYYYMMDD)
  throwIfNonDate(latestYYYYMMDD)

  if (earliestYYYYMMDD > latestYYYYMMDD)
    throw new Error(`${earliestYYYYMMDD} > ${latestYYYYMMDD}`)

  const d = new Date(earliestYYYYMMDD)
  const latest = new Date(latestYYYYMMDD)
  let dates = []
  while (d <= latest) {
    d.setDate(d.getDate() + 1)
    dates.push(datetime.getYYYYMMDD(d))
  }
  return dates
}
