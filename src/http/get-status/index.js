const arc = require('@architect/functions')

/**
 * Returns an array of statuses currently in the system
 */
// TODO status monitoring
// Ref https://github.com/covidatlas/li/issues/234
// Should provide the source data for a simple page
// | source | status (up || down) | last successful crawl | last successful scrape | error message (if status = down) |
async function getStatus () {
  const data = await arc.tables()

  // Running log
  const result = await data.status.scan({})
  const statuses = result.Items // .map(i => { return { source: i.source, event: i.event } } )

  // TODO:
  // - extract latest crawl, latest scrape for source, join together
  // - extract data from history for last successful crawl, last successful scrape, if current status !== success
  // - see if can store error message in the tables
  // - link to raw logs?

  /*
  // Past history
  const statusLogResult = await data['status-logs'].scan({})
  const slogs = statusLogResult.Items // .map(i => { return { source: i.source, ts: i.ts } } )
  */

  return {
    json: statuses,
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
    }
  }
}

exports.handler = arc.http.async(getStatus)
