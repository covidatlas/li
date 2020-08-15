const got = require('got')
const { generateReportJson } = require('./_generate-status-report.js')


/** Reports status to slack channel. */
async function sendToSlack (slackhook, data) {
  console.log('Starting post to slack')
  const options = { json: { blocks: data } }
  try {
    const response = await got.post(slackhook, options)
    console.log('done')
    console.log(`status = ${response.statusCode}`)
    console.log(`body = ${response.body}`)
  }
  catch (err) {
    console.log(err.message)
    console.log(err.stack)
    console.log(err)
  }
}


async function reportStatus () {
  // Configured at https://covid-atlas.slack.com/apps/A0F7XDUAZ-incoming-webhooks?next_id=0,
  // https://covid-atlas.slack.com/services/B019M55JLD6
  const slackhook = process.env.SLACK_STATUS_HOOK

  if (!slackhook) {
    console.log(`Missing process.env.SLACK_STATUS_HOOK in environment ${process.env.NODE_ENV}`)
    console.log('Ref https://arc.codes/reference/cli/env')
    return
  }

  const data = await generateReportJson()
  await sendToSlack(slackhook, data)
}

// Test it out if called directly.
if (!module.parent) {
  (async () => { await reportStatus() })()
}


module.exports = {
  reportStatus
}
