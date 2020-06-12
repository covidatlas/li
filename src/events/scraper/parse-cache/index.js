const csv = require('./types/csv.js')
const json = require('./types/json.js')
const page = require('./types/page.js')
const pdf = require('./types/pdf.js')
const raw = require('./types/raw.js')
const tsv = require('./types/tsv.js')

module.exports = async function parseCache (cache) {

  const parse = {
    csv: csv,
    headless: page,
    json: json,
    page,
    pdf: pdf,
    raw: raw,
    tsv: tsv
  }

  const parsed = []
  for (const hit of cache) {
    let { pages, options } = hit

    const parsePromises = pages.
          map(p => (hit.type !== 'pdf') ? p.toString() : p).
          map(content => parse[hit.type]({ content, options }))
    const results = await Promise.all(parsePromises)
    const result = hit.paginated ? results : results[ 0 ]

    const name = hit.name || 'default'
    parsed.push({ [name]: result })
  }

  return parsed
}
