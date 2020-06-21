const arc = require('@architect/functions')


/** For each source, get scrape and crawl status, and last successful
 * datetime. */
async function statusSummaryJson () {

  const data = await arc.tables()

  // Running log
  const statuses = await data.status.scan({}).then(result => result.Items)

  function eventDetails (source, e) {
    const currStatus = statuses.find(st => st.source === source && st.event === e) || {}
    return [ 'status', 'consecutive', 'last_success', 'error' ].reduce((hsh, f) => {
      return { ...hsh, [`${e}_${f}`]: currStatus[f] || null }
    }, {} )
  }

  const sources = [ ...new Set(statuses.map(s => s.source)) ].sort()

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

  return summary
}

/** Html page table of summary. */
// TODO (status) generate HTML using some kind of templating engine.
// Hacking to get HTML output for now, to be replaced w/ whatever
// templating method we choose.
function statusSummaryHtml (summary) {

  const fields = [
    'source', 'status',
    'crawler_status', 'crawler_error', 'crawler_consecutive', 'crawler_last_success',
    'scraper_status', 'scraper_error', 'scraper_consecutive', 'scraper_last_success'
  ]

  const ths = fields.map(f => `<th>${f.replace(/_/g, ' ')}</th>`).join('')
  const shortDate = dt => dt.replace('T', ' ').replace(/\..+/, '')
  const trs = summary.map(d => {
    d.crawler_last_success = shortDate(d.crawler_last_success || '')
    d.scraper_last_success = shortDate(d.scraper_last_success || '')
    d.crawler_error = (d.crawler_error || '').replace(/\n/g, '<br />')
    d.scraper_error = (d.scraper_error || '').replace(/\n/g, '<br />')
    const tr = fields.map(f => `<td>${ d[f] || '&nbsp;' }</td>`).join('')
    return `<tr class='${d.status}'>${tr}</tr>`
  })

  return `
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

}

/**
 * Returns an array of statuses currently in the system, or html if ?format=html
 */
async function getStatus (request) {
  const summary = await statusSummaryJson()

  // Default response is json.
  const result = {
    statusCode: 200,
    body: JSON.stringify(summary, null, 2),
    headers: {
      'cache-control': 'max-age=300, s-maxage=300'
    }
  }

  // Html if requested.
  const format = request.queryStringParameters['format'] || ''
  if (format.toLowerCase() === 'html') {
    result.body = statusSummaryHtml(summary)
    result.headers['Content-Type'] = 'text/html'
  }

  return result
}

exports.handler = arc.http.async(getStatus)
