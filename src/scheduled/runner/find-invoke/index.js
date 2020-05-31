const arc = require('@architect/functions')
const sorter = require('@architect/shared/utils/sorter.js')

/**
 * Find the next eligible key to invoke
 */
module.exports = async function findNextInvoke () {
  const data = await arc.tables()
  const type = 'runner'

  // Maybe swap this later for a query, scan should prob be fine forever tho
  let invokes = await data.invokes.scan({})
  invokes = invokes.Items.filter(i => i.type === type)

  const tasks = [ 'crawler', 'scraper' ]

  const timestamps = invokes.map(i => i.lastInvoke)
  const sorted = sorter(timestamps)
  const last = invokes.findIndex(i => i.lastInvoke === sorted[sorted.length - 1])
  const task = tasks[last + 1] || tasks[0]

  await data.invokes.put({
    type,
    key: task,
    lastInvoke: new Date().toISOString()
  })

  return task
}
