/** Timeseries filtering.
 *
 * When scraping timeseries, we need to filter to only include data
 * that matches the scrape date.  Sources report dates in slightly
 * different formats, so we often need to convert the date to match
 * the YYYY-MM-DD format of the 'date' string passed into
 * `scrape(data, date, ...)`.
 *
 * In addition, many timeseries sources report data that is slightly
 * stale (e.g., if running on 2020-06-20, the source may only include
 * data up to 2020-06-19).  We therefore sometimes need to change the
 * date that we're reporting on.
 *
 * Args:
 *   data: array of hashes
 *   dateField: field in data that contains date info
 *   getYYYYMMDD: function to convert record[dateField] to YYYY-MM-DD format
 *   date: the scrape date
 *
 * Returns
 *   {
 *     func: function to use as filter of data  (e.g. data.filter(func).map ... )
 *     filterDate: the actual date of the filtered data returned.
 *   }
 *
 * See test cases for more examples.
 *
 ** USAGE:

const timeseriesFilter = require('../_lib/timeseries-filter.js')

scrape (data, date) {

  // NY reports data as MM-DD-YYYY (e.g, '05-27-2020')
  function toYYYYMMDD (datestring) {
    const [ m, d, y ] = datestring.split('/')
    return [ y, m, d ].join('-')
  }

  const { filterDate, func } = timeseriesFilter(data, 'Test Date', toYYYYMMDD, date)

  const counties = data.filter(func).map(row => {

 */
module.exports = function timeseriesFilter (data, dateField, getYYYYMMDD, date, operator = '===') {
  const result = {
    func: () => true,
    filterDate: date
  }

  if (data.length === 0)
    return result

  const allDates = [ ...data.map(d => d[dateField]) ].
        map(dt => getYYYYMMDD(dt)).
        sort()

  if (date < allDates[0])
    throw new Error(`Scrape date ${date} < earliest data data ${allDates[0]}`)

  const latestDate = allDates.slice(-1)[0]


  function daysDifference (later, earlier) {
    const dateFromYYYYMMDD = s => {
      const [ yyyy, mm, dd ] = s.split('-').map(s => parseInt(s, 10))
      return new Date(yyyy, mm - 1, dd)
    }
    const msPerDay = 1000 * 60 * 60 * 24
    const staleDays = (dateFromYYYYMMDD(later) - dateFromYYYYMMDD(earlier)) / msPerDay
    return Math.floor(staleDays)
  }

  if (date > latestDate) {
    const daysDiff = daysDifference(date, latestDate)
    if (daysDiff > 7)
      throw new Error(`stale: latest data is from ${latestDate}, ${daysDiff} days ago`)
  }

  let filterDate = date
  if (filterDate > latestDate)
    filterDate = latestDate
  console.log(`scraping data from ${filterDate}`)

  let func = null
  switch (operator) {
  case '===':
    func = (d) => getYYYYMMDD(d[dateField]) === filterDate
    break
  case '<=':
    func = (d) => getYYYYMMDD(d[dateField]) <= filterDate
    break
  default:
    throw new Error(`Unhandled operator ${operator}`)
  }

  return { func, filterDate }
}
