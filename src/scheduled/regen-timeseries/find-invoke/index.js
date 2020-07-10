const arc = require('@architect/functions')
const nextInvoke = require('./_next-invoke.js')

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

  // Add invoke entries for new timeseries sources
  const newInvokes = sources.
        filter(s => !invokes.some(i => i.key === s._sourceKey)).
        map(s => { return { type, key: s._sourceKey } })
  console.log(`newInvokes: ${JSON.stringify(newInvokes)}`)
  for (const i of newInvokes)
    await data.invokes.put(i)

  const invokeCandidates = invokes.concat(newInvokes)
  console.log(`invokeCandidates: ${JSON.stringify(invokeCandidates)}`)
  const next = nextInvoke(invokeCandidates)
  console.log(`next: ${JSON.stringify(next)}`)

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
