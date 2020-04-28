/**
 * Updates the canonical source status
 * Then records a log entry
 */
module.exports = async function logStatus (item, data) {
  item.updated = new Date().toISOString()
  await data.status.put(item)

  let log = JSON.parse(JSON.stringify(item)) // Let's not mutate anything inadvertently
  log.ts = log.updated
  delete log.created
  delete log.updated
  await data['status-logs'].put(log)
}
