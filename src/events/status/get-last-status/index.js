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
      consecutive: 0,
      created: now,
      updated: now
    }
    return item
  }
  else return result
}
