const arc = require('@architect/functions')

module.exports = async function fireEvents (task, sources) {
  // The return of el cheapo queue
  let queue = 0
  for (const source of sources) {
    // Invoke the timeseries scraper many times
    setTimeout(async () => {
      await arc.events.publish({
        name: task,
        payload: {
          source: source._sourceKey
        }
      })
    }, queue)
    queue += 1000
  }
  console.log(`Publishing ${sources.length} ${task} events`)
}
