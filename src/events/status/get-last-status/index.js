// const arc = require('@architect/functions')
const log = require('../log/index.js')

module.exports = async function getLastStatus (params, data) {
  const { source, event, status } = params

  const result = await data.status.get({ source, event })

  if (!result) {
    // Fresh source, set its first status!
    const now = new Date().toISOString()
    const item = {
      source,
      event,
      status,
      consecutive: 1,
      created: now,
      updated: now
    }
    await log(item, data)
    return item
  }
  else return result
}
