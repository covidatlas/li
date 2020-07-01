const arc = require('@architect/functions')

async function getJson () {
  const data = await arc.tables()
  return await data['report-status'].scan({}).
    then(result => result.Items).
    then(items => items.sort((a, b) => a.reportSource < b.reportSource ? -1 : 1))
}

function toHtml (s) {
  if (s === null || s === undefined || s === '')
    return '&nbsp;'
  return ('' + s).replace(/ /g, '&nbsp;').replace(/\n/g, '<br />')
}

/** Html page table of summary. */
// TODO (status) generate HTML using some kind of templating engine.
// Hacking to get HTML output for now, to be replaced w/ whatever
// templating method we choose.
function html (json) {

  const shortDate = dt => (dt || '').replace('T', ' ').replace(/\..+/, '')
  const tblJson = json.map(d => {
    d.updated = shortDate(d.updated)
    return d
  })

  const fields = [ 'report', 'status', 'updated' ]
  const headings = fields
  const ths = headings.map(h => `<th>${h}</th>`).join('')
  const trs = tblJson.map(d => {
    const tr = fields.map(f => `<td>${ toHtml(d[f]) }</td>`).join('')
    return `<tr class='${d.status}'>${tr}</tr>`
  })

  return `
<html>

<style>
p, h1 {
  font-family: Arial;
}

th, td {
  padding: 5px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

tr:hover { background-color: #f5f5f5; }

.success { color:green; }
.generating { color: blue; }
.pending { color: orange; }
.failed { color:red; }
</style>

<body>
<h1>Report Statuses</h1>

<pre><code>
<table>
<tr>${ths}</tr>
${trs.join('\n')}
</table>

</code></pre>
</body>

</html>`

}

async function getReportStatus (request) {
  const json = await getJson()

  // Default response is json.
  const result = {
    statusCode: 200,
    body: JSON.stringify(json, null, 2),
    headers: {
      'cache-control': 'max-age=300, s-maxage=300'
    }
  }

  // Html if requested.
  const format = request.queryStringParameters['format'] || ''
  if (format.toLowerCase() === 'html') {
    result.body = html(json)
    result.headers['Content-Type'] = 'text/html'
  }

  return result
}

exports.handler = arc.http.async(getReportStatus)
