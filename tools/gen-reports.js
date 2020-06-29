/** CLI entry point, generate reports.
 *
 * We're using an event to start the report generation because that
 * routine has to access the data currently loaded in the sandbox
 * dynamoDB server process.  There is likely a way to attach to the
 * dynamoDB directly (similarly to arc repl), but it adds unnecessary
 * complexity.
 */

const arc = require('@architect/functions')

;(async () => {
  await arc.events.publish({
    name: 'reports',
    payload: {}
  })
})()
