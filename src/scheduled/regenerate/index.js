const arc = require('@architect/functions')
const findTimeseries = require('./find-timeseries/index.js')
const findNextInvoke = require('./find-invoke/index.js')
const fireEvents = require('./fire-events/index.js')

// Loop through the days and publish events
async function invoke (source) {
  await fireEvents(source)
}

/**
 * Regenerate a timeseries
 * Takes a source, or finds the next one to invoke from the database
 */
async function regenerateTimeseries (event) {
  let { source } = event
  try {
    /**
     * Find our timeseries source(s)
     */
    const sources = findTimeseries(event)

    // Immediately invoke
    if (source && sources.length === 1) {
      await invoke(sources[0])
      return
    }

    /**
     * Find the next timeseries source to invoke
     */
    source = await findNextInvoke(sources)
    if (!source) {
      console.log('No sources found!')
      return
    }
    await invoke(source)
  }
  catch (err) {
    console.error(err)
    throw Error(err)
  }
}

exports.handler = arc.events.subscribe(regenerateTimeseries)
module.exports = regenerateTimeseries
