const datetime = require('@architect/shared/datetime/index.js')

/** Gets an array of dates, with the earliest and the latest as the
 * boundaries.
 *
 * Such a simple function, but js can make it difficult.
 */
module.exports = function getDatesRange (earliestYYYYMMDD, latestYYYYMMDD) {

  const d = new Date(earliestYYYYMMDD)
  const latest = new Date(latestYYYYMMDD)
  let dates = []
  while (d <= latest) {
    d.setDate(d.getDate() + 1)
    dates.push(datetime.getYYYYMMDD(d))
  }
  return dates

}
