/** Generate the status slack report.
 *
 * Put in a separate module for testing.
 */

const got = require('got')
const site = require('@architect/shared/utils/site.js')

// Can only have 3000 chars in text blocks.
// Ref https://api.slack.com/reference/block-kit/blocks#section_fields
const MAX_SLACK_TEXT_BLOCK_LENGTH = 3000

/** Get the failures. */
async function getScraperReport () {

  const path = `${site.root()}/status`
  const result = await got(path)
  const data = JSON.parse(result.body)

  const failures = data.details.
        filter(d => d.status !== 'success').
        map(d => {
          const failType = (d.crawler_status !== 'success') ? 'crawler' : 'scraper'
          return {
            source: d.source,
            failType: failType,
            message: d[`${failType}_error`],
            last_success: d[`${failType}_last_success`]
          }
        })

  return {
    summary: data.summary,
    failures
  }
}


/** Markdown table of failures. */
function failureTable (failures) {

  function daysSinceLastSuccess (now, last_success_string) {
    if (last_success_string === null)
      return '-'
    const last_success = new Date(last_success_string)
    const diff = (now.getTime() - last_success.getTime())
    const failure_for_days = Math.floor(diff / (1000 * 60 * 60 * 24))
    return failure_for_days
  }

  function truncate (msg, truncateAt = 50) {
    let tmp = msg.split('\n')[0]
    if (tmp.length <= truncateAt)
      return tmp
    tmp = tmp.slice(0, truncateAt - 4)
    return `${tmp} ...`
  }

  const now = new Date()
  const outrows = failures.
        map(f => {
          const msg = [ f.source, f.message ].join(': ')
          return [ daysSinceLastSuccess(now, f.last_success), truncate(msg, 70) ]
        })

  let table = []
  table.push([ 'Days', 'Failure' ])
  table.push([ '----', '-------' ])
  table = table.concat(outrows)

  table = table.map(r => [ `${r[0]}`.padStart(4, ' '), r[1] ].join('  '))
  return [ '```', table.join('\n'), '```' ].join('')
}

function bulletedList (arr) {
  return arr.map(s => `* ${s}`).join('\n')
}

function getSection (failures, failType) {
  if (failures.length === 0)
    return null

  const title = `${failures.length} ${failType} failures:`
  let failuresText = `${title}
${failureTable(failures)}`

  if (failuresText.length > MAX_SLACK_TEXT_BLOCK_LENGTH) {
    failuresText = `${title}
_(Insufficient space to show details)_
${bulletedList(failures.map(f => f.source))}`
  }

  if (failuresText.length > MAX_SLACK_TEXT_BLOCK_LENGTH) {
    failuresText = `${title}
_(Insufficient space to list sources)_`
  }

  return failuresText
}

function getReportStruct (scraperReport) {

  const statusPage = `${site.root()}/status?format=html`
  const summary = scraperReport.summary

  // If a record has never succeeded, return a dummy date so it sorts
  // to the top when the records are sorted by descending date order.
  const lastSuccess = rec => rec.last_success || '1000-01-01'

  const failures = scraperReport.failures.
        sort((a, b) => {
          const aLast = lastSuccess(a)
          const bLast = lastSuccess(b)
          if (aLast === bLast)
            return 0
          if (aLast > bLast)
            return 1
          return -1
        })

  return [
    `*Report for ${new Date().toISOString().split('T')[0]}:*`,
    `Sources: ${summary.successes} successes, ${summary.failures} failures.`,
    getSection(failures.filter(f => f.failType === 'crawler'), 'crawler'),
    getSection(failures.filter(f => f.failType === 'scraper'), 'scraper'),
    `See details: ${statusPage}`
  ].
    filter(s => s).
    map(t => {
      return {
        type: 'section',
        text: { type: 'mrkdwn', text: t }
      }
    })
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


if (module.parent === null) {
  (async () => {
    const result = await generateReportJson().
          then(d => d.map(rec => {
            rec.length = rec.text.text.length
            return rec
          })).
          then(d => d.map(rec => {
            rec.warning = (rec.length > MAX_SLACK_TEXT_BLOCK_LENGTH ? 'TOO_LONG' : null)
            return rec
          }))

    console.log(result)
    if (result.some(rec => rec.warning !== null)) {
      console.log('*'.repeat(40))
      console.log('WARNING -- this will not work in slack.')
      console.log('*'.repeat(40))
    }
  })()
}
