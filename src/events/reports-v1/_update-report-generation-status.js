/** Update the table report-gen-status. */
const arc = require('@architect/functions')

module.exports = async function update (report, version, status, params = {}) {
  const rpt = { report, version, status, ...params }
  rpt.updated = params.updated || new Date().toISOString()
  await arc.tables().
    then(data => data['report-generation-status'].put(rpt))
  console.log(`Report ${report} (${version}): ${status}`)
}
