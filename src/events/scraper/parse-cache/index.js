const csv = require('./types/csv.js')
const json = require('./types/json.js')
const page = require('./types/page.js')
const pdf = require('./types/pdf.js')
const tsv = require('./types/tsv.js')

module.exports = async function parseCache (cache, date) {

  const parse = {
    csv: csv,
    headless: page,
    json: json,
    page,
    pdf: pdf,
    tsv: tsv
  }

  const parsed = []
  for (const hit of cache) {
    let { data } = hit
    // Convert non-binaries out of the buffer
    let result
    if (hit.type !== 'pdf') {
      data = data.toString()
      result = parse[hit.type]({ data, date })
    }
    else {
      result = await parse[hit.type]({ data, date })
    }
    const name = hit.name || 'default'
    parsed.push({ [name]: result })
  }
  return parsed

}
