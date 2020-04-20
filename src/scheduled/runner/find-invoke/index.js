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
  let task

  // Add entries for the new kids
  if (invokes.length) {
    task = tasks[0]
  }

  // This will likely need to be rewritten if the task runner ever takes on more than just crawling and scraping
  const timestamps = invokes.map(i => i.lastInvoke)
  const sorted = sorter(timestamps)
  const last = invokes.find(i => i.lastInvoke === sorted[0])
  task = last.key

  await data.invokes.put({
    type,
    key: task,
    lastInvoke: new Date().toISOString()
  })

  return task
}
