const { reportStatus } = require('./_slack-post.js')

/** Reports status to slack channel. */
exports.handler = async function handleReportStatus () {
  await reportStatus()
}

