const getSources = require('./get-sources/index.js')
const findNextInvoke = require('./find-invoke/index.js')
const fireEvents = require('./fire-events/index.js')

/**
 * Task runner
 */
exports.handler = async function taskRunner () {
  /**
   * Get all active sources
   */
  const sources = getSources()

  /**
   * Find the next task to invoke
   */
  const task = await findNextInvoke(sources)

  /**
   * Publish task events for each source
   */
  await fireEvents(task, sources)
}
