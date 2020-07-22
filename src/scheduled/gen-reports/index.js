const arc = require('@architect/functions')

exports.handler = async function generateReports () {
  await arc.events.publish({
    name: 'reports-v1',
    payload: {}
  })
}
