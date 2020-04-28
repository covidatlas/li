const arc = require('@architect/functions')
const getSource = require('@architect/shared/sources/_lib/get-source.js')
const fireEvents = require('./fire-events/index.js')

/**
 * Source regenerator: rebuild a source from cache
 */
async function regenerateSource (event) {
  try {
    /**
     * Load the requested source
     */
    const source = getSource(event)

    /**
     * Publish scrape events for each day
     */
    await fireEvents(source)
  }
  catch (err) {
    console.log('Regenerator error', event)
    throw err
  }
}

exports.handler = arc.events.subscribe(regenerateSource)
