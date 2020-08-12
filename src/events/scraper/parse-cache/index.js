const assert = require('assert')
const csv = require('./types/csv.js')
const json = require('./types/json.js')
const page = require('./types/page.js')
const pdf = require('./types/pdf.js')
const raw = require('./types/raw.js')
const tsv = require('./types/tsv.js')
const xlsx = require('./types/xlsx.js')

module.exports = async function parseCache (cache) {

  const parse = {
    csv: csv,
    headless: page,
    json: json,
    page,
    pdf: pdf,
    raw: raw,
    tsv: tsv,
    xlsx: xlsx
  }

  const parsed = []
  for (const hit of cache) {
    let { content, options } = hit
    if (hit.type !== 'pdf' && hit.type !== 'xlsx')
      content = content.toString()
    assert(parse[hit.type], `have parser for ${hit.type}`)
    const result = await parse[hit.type]({ content, options })
    const name = hit.name || 'default'
    parsed.push({ [name]: result })
  }

  return parsed
}
