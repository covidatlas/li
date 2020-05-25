const arc = require('@architect/functions')

module.exports = async function fireEvents (task, sources) {
  let counter = 0

  // The return of el cheapo queue
  let queue = 0
  const events = sources.map(source => {
    return new Promise ((resolve, reject) => {
      setTimeout(() => {
        arc.events.publish({
          name: task,
          payload: {
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
    console.log(`Published ${counter} of ${sources.length} ${task} events`)
  })
}
