const datetime = require('@architect/shared/datetime/index.js')
const spacetime = require('spacetime')

/**
 * To find the right cache file we must first narrow down the right folder(s)
 * And bc a given source may be UTC- || UTC || UTC+, it's simplest to pull down yesterday, today, & tomorrow
 */
module.exports = function getDatedFolders (params) {
  const {
    date,
    folders,
    timeseries,
    tz
  } = params

  // Even though time is a flat circle, establish "today"
  let d = timeseries ? datetime.today.at(tz) : date
  let today = folders.findIndex(f => f === d)
  if (today === -1) today = folders.findIndex(f => f === datetime.getYYYYMMDD())

  // Remember: there may be a gap in cache dirs – it happens!
  let cacheDirs = [ today ]

  // Yesterday
  const t = spacetime(d)
  let yesterday = t.subtract(1, 'day').format('iso-short')
  yesterday = folders.findIndex(f => f === yesterday)
  if (yesterday !== -1) cacheDirs.unshift(yesterday)

  // Tomorrow (don't stop thinking about it)
  let tomorrow = t.add(1, 'day').format('iso-short')
  tomorrow = folders.findIndex(f => f === tomorrow)
  if (tomorrow !== -1) cacheDirs.push(tomorrow)

  return cacheDirs
}
