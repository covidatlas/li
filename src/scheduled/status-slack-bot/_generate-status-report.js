/** Generate the status slack report.
 *
 * Put in a separate module for testing.
 */

const got = require('got')
const site = require('@architect/shared/utils/site.js')
const slackTable = require('slack-table').default

const SINCE_LAUNCH = '(always)'

function daysSinceLastSuccess (now, last_success_string) {
  if (last_success_string === null)
    return SINCE_LAUNCH
  const last_success = new Date(last_success_string)
  const diff = (now.getTime() - last_success.getTime())
  const failure_for_days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return failure_for_days
}

/** Get the failures. */
async function getScraperReport () {

  const path = `${site.root()}/status`
  const result = await got(path)
  const data = JSON.parse(result.body)

  const now = new Date()
  const failures = data.details.
        filter(d => d.status !== 'success').
        map(d => {
          const failType = (d.crawler_status !== 'success') ?
                'crawler' : 'scraper'
          const rawMessage = d[`${failType}_error`]
          let message = rawMessage.split('\n')[0].slice(0, 50)
          if (rawMessage.length > 100)
            message += ' ...'
          const failing_for_days = daysSinceLastSuccess(now, d[`${failType}_last_success`])

          return {
            source: d.source,
            failure_type: failType,
            message,
            failing_for_days
          }
        }).
        sort((a, b) => {
          let af = a.failing_for_days
          if (af === SINCE_LAUNCH)
            af = 10000
          let bf = b.failing_for_days
          if (bf === SINCE_LAUNCH)
            bf = 10000
          if (af === bf)
            return 0
          if (af > bf)
            return -1
          return 1
        })

  return {
    summary: data.summary,
    failures
  }
}

/** Markdown table of failures. */
function failureTable (failures) {

  // NO IDEA why I had to include sorting for the lengths, but when I
  // removed it, node was sorting it as if it was alpha (e.g., 13 was
  // sorting before 2).
  const sortedNameLengths = failures.map(f => f.source).map(s => s.length).sort((a, b) => {
    if (a === b)
      return 0
    if (a < b)
      return -1
    return 1
  })
  const longestSourceName = sortedNameLengths.slice(-1)[0]

  const table = slackTable({
    title: 'Failures',
    columns: [
      { width: longestSourceName + 2, title: 'Source', dataIndex: 'source' },
      { width: 10, title: 'Failure', dataIndex: 'failure_type' },
      { width: 10, title: 'Days', dataIndex: 'failing_for_days', align: 'right' },
      { width: 60, title: 'Message', dataIndex: 'message' }
    ],
    dataSource: failures
  })

  return table.replace('*Failures*', '_Failures, sorted in desc order_')
}

function reportStruct (scraperReport) {

  const summary = scraperReport.summary

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Report for ${new Date().toISOString().split('T')[0]}:*`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `
Sources: ${summary.successes} successes, ${summary.failures} failures.

${failureTable(scraperReport.failures)}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `See details: ${site.root()}/status?format=html`
      }
    }
  ]

}

(() => getScraperReport().then(d => console.log(reportStruct(d))))()

module.exports = {
  getScraperReport,
  reportStruct
}
