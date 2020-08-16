/** Generate the status slack report.
 *
 * Put in a separate module for testing.
 */

const got = require('got')
const site = require('@architect/shared/utils/site.js')

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

          const failing_for_days = daysSinceLastSuccess(now, d[`${failType}_last_success`])

          return {
            source: d.source,
            message: d[`${failType}_error`],
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

  function truncate (msg, truncateAt = 50) {
    let tmp = msg.split('\n')[0]
    if (tmp.length <= truncateAt)
      return tmp
    tmp = tmp.slice(0, truncateAt - 4)
    return `${tmp} ...`
  }

  function makeRow (row) {
    return [ `${row[0]}`.padStart(4, ' '), row[1] ].join('  ')
  }

  const outrows = failures.
        map(f => {
          const msg = [ f.source, f.message ].join(': ')
          return [ f.failing_for_days, truncate(msg, 70) ]
        })
  let table = []
  table.push([ 'Days', 'Failure' ])
  table.push([ '----', '-------' ])
  table = table.concat(outrows)
  table = table.map(r => makeRow(r))

  return [ '```', table.join('\n'), '```' ].join('')
}

function bulletedList (arr) {
  return arr.map(s => `* ${s}`).join('\n')
}

function getReportStruct (scraperReport) {

  const statusPage = `${site.root()}/status?format=html`
  const summary = scraperReport.summary

  const alwaysFailing = scraperReport.failures.
        filter(f => f.failing_for_days === SINCE_LAUNCH).
        map(f => f.source)
  const allFailList = [ '```', alwaysFailing.join(', '), '```' ].join('')
  const alwaysFailingText = `${alwaysFailing.length} sources have never worked:
${allFailList}`

  const failures = scraperReport.failures.filter(f => f.failing_for_days !== SINCE_LAUNCH)
  let failuresText = `${failures.length} failures:
${failureTable(failures)}`

  // Can only have 3000 chars in text blocks.
  // Ref https://api.slack.com/reference/block-kit/blocks#section_fields
  const MAX_LENGTH = 3000
  if (failuresText.length > MAX_LENGTH) {
    failuresText = `_Failures (Insufficient space to show details ... see the [status page](${statusPage}))_
${bulletedList(failures.map(f => f.source))}`
  }

  return [
    `*Report for ${new Date().toISOString().split('T')[0]}:*`,
    `Sources: ${summary.successes} successes, ${summary.failures} failures.`,
    alwaysFailingText,
    failuresText,
    `See details: ${statusPage}`
  ].map(t => { return { type: 'section', text: { type: 'mrkdwn', text: t } } })

}

/** Public method to gen report data for Slack report. */
async function generateReportJson () {
  const data = await getScraperReport()
  return getReportStruct(data)
}


module.exports = {
  getScraperReport,
  getReportStruct,
  generateReportJson
}
