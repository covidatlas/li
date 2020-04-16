const arc = require('@architect/functions')
const sorter = require('@architect/shared/utils/sorter.js')
const datetime = require('@architect/shared/datetime/index.js')

module.exports = async function fireEvents (source) {
  const { scrapers } = source

  let earliest = sorter(scrapers.map(s => s.startDate))[0]

  // In the future perhaps we can do something smarter than starting from startDate
  const today = new Date()
  const d = new Date(earliest)
  let dates = []
  while (d < today) {
    d.setDate(d.getDate() + 1)
    dates.push(datetime.getYYYYMMDD(d))
  }

  // The return of el cheapo queue
  let queue = 0
  for (const date of dates) {
    // Invoke the timeseries scraper many times
    setTimeout(async () => {
      await arc.events.publish({
        name: 'scraper',
        payload: {
          date,
          source: source.source
        }
      })
    }, queue)
    queue += 1000
  }
}
