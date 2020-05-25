const arc = require('@architect/functions')

/**
 * Find the next eligible key to invoke
 */
module.exports = async function findNextInvoke (sources) {
  const data = await arc.tables()
  const type = 'regenerate'

  // Ensure retired sources don't make their way into the pool
  const isActiveSource = key => sources.some(s => s._sourceKey === key)

  // Maybe swap this later for a query, scan should prob be fine forever tho
  let invokes = await data.invokes.scan({})
  invokes = invokes.Items.filter(i => i.type === type && isActiveSource(i.key))

  // Add entries for any new kids recently added to the source set
  const missing = sources.filter(s => !invokes.some(i => i.key === s._sourceKey))
  if (missing.length) {
    for (const source of missing) {
      await data.invokes.put({ type, key: source._sourceKey })
    }
  }

  // Find the next that's 12+ hours old, order shouldn't matter until we have a ton of these
  const next = invokes.find(i => {
    // Never regenerate more than every 12 hours
    const meow = new Date()
    let aBitAgo = meow.setHours(meow.getHours() - 12)
    aBitAgo = new Date(aBitAgo).toISOString()
    return !i.lastInvoke || aBitAgo > i.lastInvoke
  })

  if (!next) {
    return
  }

  await data.invokes.put({
    type,
    key: next.key,
    lastInvoke: new Date().toISOString()
  })

  return next.key
}
