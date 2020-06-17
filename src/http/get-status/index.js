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
  const statuses = await data.status.scan({}).then(result => result.Items)

  // Past history.
  // TODO: improve the query to only return the last success.
  // This is returning the full data and then using lastSuccess() to get the last success.
  const logs = await data['status-logs'].scan({}).then(result => result.Items)

  function lastSuccess (source, e) {
    const success = sl => (sl.source === source && sl.event === e && sl.status === 'success')
    const successes = logs.filter(success)
    if (successes.length === 0)
      return null
    const t = successes.map(s => s.ts).sort().slice(-1)[0]
    return t.replace('T', ' ').replace(/\..+/, '')
  }

  function eventDetails (source, e) {
    const currStatus = statuses.find(st => st.source === source && st.event === e) || {}
    currStatus.last_success = lastSuccess(source, e)
    return [ 'status', 'consecutive', 'last_success' ].reduce((hsh, f) => {
      return { ...hsh, [`${e}_${f}`]: currStatus[f] || null }
    }, {} )
  }

  const sources = [ ...new Set(statuses.map(s => s.source)) ].sort()

  // TODO (status) store error message in the tables
  // TODO (status) add link to raw logs?
  const summary = sources.map(source => {
    return {
      source,
      ...eventDetails(source, 'crawler'),
      ...eventDetails(source, 'scraper')
    }
  }).map(d => {
    const status = [ d.crawler_status, d.scraper_status ].
          includes('failed') ? 'failed' : 'success'
    return {
      ...d,
      status
    }
  })

  // TODO (status) generate HTML using some kind of templating engine.
  // Hacking to get HTML output for now, to be replaced w/ whatever
  // templating method we choose.
  const fields = [
    'source', 'status',
    'crawler_status', 'crawler_consecutive', 'crawler_last_success',
    'scraper_status', 'scraper_consecutive', 'scraper_last_success'
  ]

  const ths = fields.map(f => `<th>${f.replace(/_/g, ' ')}</th>`).join('')
  const trs = summary.map(d => {
    const tr = fields.map(f => `<td>${ d[f] || '&nbsp;' }</td>`).join('')
    return `<tr class='${d.status}'>${tr}</tr>`
  })

  const response_body = `
<html>

<style>
h1 {
  font-family: Arial;
}

th, td {
  padding: 5px;
  text-align: left;
  /* font-family: sans-serif; */
  border-bottom: 1px solid #ddd;
}

tr:hover { background-color: #f5f5f5; }

.success { color:green; }

.failed { color:red; }
</style>

<body>
<h1>Source Statuses</h1>
<pre><code>

<table style='cell-padding: 5px;'>
<tr>${ths}</tr>
${trs.join('\n')}
</table>

</code></pre>
</body>

<!-- Clickable column headings. -->
<script>
// Copy of
// https://stackoverflow.com/questions/14267781/sorting-html-table-with-javascript
// Hackish, works.

const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
    )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

// do the work...
document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
    const table = th.closest('table');
    Array.from(table.querySelectorAll('tr:nth-child(n+2)'))
        .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
        .forEach(tr => table.appendChild(tr) );
})));
</script>

</html>`


  return {
    statusCode: 200,
    body: response_body,
    headers: {
      'Content-Type': 'text/html',
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
    }
  }
}

exports.handler = arc.http.async(getStatus)
