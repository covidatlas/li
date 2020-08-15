/** Generate the status slack report.
 *
 * Put in a separate module for testing.
 */

const got = require('got')
const site = require('@architect/shared/utils/site.js')


const SINCE_LAUNCH = '(never succeeded)'

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
          let message = rawMessage.split('\n')[0].slice(0, 100)
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

function generateReport (scraperReport) {

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

TODO table here.`
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

(() => getScraperReport().then(d => console.log(generateReport(d))))()

module.exports = {
  getScraperReport,
  generateReport
}
