const arc = require('@architect/functions')
const findTimeseries = require('./find-timeseries/index.js')
const findNextInvoke = require('./find-invoke/index.js')

/**
 * Timeseries regenerator
 * Finds an eligible timeseries to regenerate and invokes the regenerator
 */
exports.handler = async function regenerateTimeseries () {
  /**
   * Find our timeseries source(s)
   */
  const sources = findTimeseries()

  /**
   * Find the next timeseries source to invoke
   */
  const source = await findNextInvoke(sources)

  if (source) {
    await arc.events.publish({
      name: 'regenerator',
      payload: {
        source
      }
    })
  }
  else {
    console.log('No sources found!')
  }
}
