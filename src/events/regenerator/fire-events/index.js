const arc = require('@architect/functions')
const sorter = require('@architect/shared/utils/sorter.js')
const datetime = require('@architect/shared/datetime/index.js')
const getDatesRange = require('./_get-date-range.js')

module.exports = async function fireEvents (source) {
  const { scrapers } = source
  let counter = 0

  let earliest = sorter(scrapers.map(s => s.startDate))[0]

  // In the future perhaps we can do something smarter than starting from startDate
  const today = new Date()
  const dates = getDatesRange(earliest, datetime.getYYYYMMDD(today))

  // The return of el cheapo queue
  let queue = 0
  const events = dates.map(date => {
    return new Promise ((resolve, reject) => {
      setTimeout(() => {
        arc.events.publish({
          name: 'scraper',
          payload: {
            date,
            source: source._sourceKey
          }
        }, function done (err) {
          if (err) return reject(err)
          else {
            counter++
            return resolve()
          }
        })
      }, queue)
      queue += 1000
    })
  })

  return Promise.all(events).then(() => {
    console.log(`Published ${counter} of ${dates.length} regeneration eents`)
  })
}
