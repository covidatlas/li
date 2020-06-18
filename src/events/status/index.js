const arc = require('@architect/functions')
const getLastStatus = require('./get-last-status/index.js')
const log = require('./log/index.js')

/**
 * Expect source, event, status
 */
async function updateStatus (params) {
  try {
    const { source, event, status } = params
    // Status can be one of: success, failed

    const timeLabel = `Status update: ${source} / ${event} / ${status}`
    console.time(timeLabel)

    const data = await arc.tables()

    /**
     * Start by checking the latest status
     */
    const lastStatus = await getLastStatus(params, data)
    let newStatus = Object.assign({}, lastStatus)
    newStatus.status = status

    if (status === 'success')
      newStatus.last_success = new Date().toISOString()

    /**
     * Refresh consecutive
     */
    if (lastStatus.status === status) {
      newStatus.consecutive++
    }
    else newStatus.consecutive = 1

    // Write before we start to do stuff
    await log(newStatus, data)

    /**
     * Handle the warnings and such
     */

    // If things were and still are ok, do nothing

    // If things were ok and now they're not, maybe warn? idk
    // if (lastStatus.status === 'success' && status === 'failed') {}

    // If things are not ok for the second time in a row, fire alerts
    if (lastStatus.status === 'failed' &&
        newStatus.status === 'failed' &&
        newStatus.consecutive === 2) {
      // TODO Fire alerts that source went offline
    }

    // If things weren't ok but now they are
    if (lastStatus.status === 'failed' && status === 'success') {
      // TODO Fire alerts that source recovered
    }

    console.timeEnd(timeLabel)
  }
  catch (err) {
    console.error(`Status update failed: ${JSON.stringify(params, null, 2)}`)
    throw err
  }
}

exports.handler = arc.events.subscribe(updateStatus)
