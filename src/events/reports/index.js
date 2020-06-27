const arc = require('@architect/functions')
const generateReport = require('./gen-report')

async function reportStatus (item) {
  item.updated = new Date().toISOString()
  await arc.tables().
    then(data => data['report-status'].put(item))
}

/**
 * Generate a report.
 */
async function handleEvent (event) {
  try {
    // TODO (reports) add filtering.
    event.reportLocation = event.report + '-TODO-filtering'
    console.log(`got event: ${JSON.stringify(event, null, 2)}`)
    await reportStatus(Object.assign(event, { status: 'generating' }))
    await generateReport(event)
    await reportStatus(Object.assign(event, { status: 'success' }))
  }
  catch (err) {
    const errMsg = err.message
    const status = Object.assign(event, { status: 'failed', error: errMsg })
    await reportStatus(status)
    throw err
  }
}

exports.handler = arc.events.subscribe(handleEvent)
