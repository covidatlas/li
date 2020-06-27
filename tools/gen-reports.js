/** CLI entry point, generate reports.
 *
 * We're using an event to start the report generation because that
 * routine has to access the data currently loaded in the sandbox
 * dynamoDB server process.  There is likely a way to attach to the
 * dynamoDB directly (similarly to arc repl), but it adds unnecessary
 * complexity.
 */

require('../src/cli/env.js')()
const args = require('../src/cli/args.js')
const arc = require('@architect/functions')

let { report } = args

// TODO (reports) select good default
// TODO (reports) should we let ppl run one specific report?  or just run all?
if (!report)
  report = 'a'

;(async () => {
  await arc.events.publish({
    name: 'reports',
    payload: {
      report
    }
  })
})()
