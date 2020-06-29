const arc = require('@architect/functions')

const generateData = require('./generate-data/index.js')
const writeFile = require('./write/index.js')

async function reportStatus (filename, status, params = {}) {
  const rpt = { report: filename, status, ...params }
  rpt.updated = new Date().toISOString()
  await arc.tables().
    then(data => data['report-status'].put(rpt))
  console.log(`Report ${filename}: ${status}`)
}


async function doGeneration (hsh) {
  const f = hsh.filename

  let result = null
  try {
    await reportStatus(f, 'generating')
    result = await hsh.generate()
    if (f.endsWith('.json'))
      result = JSON.stringify(result, null, 2)
    if (!hsh.skipSave) {
      await reportStatus(f, 'saving')
      await writeFile(f, result)
    }
    await reportStatus(f, 'success')
    return result
  }
  catch (err) {
    const errMsg = [ err.message, err.stack ].join('\n')
    await reportStatus(f, 'failed', { error: errMsg })
    return result
  }
}

/**
 * Generate a report.
 */
async function handleEvent (event) {

  // All reports depend on baseJson, it must be generated first.
  let baseJson = null

  // Integration tests can override where sources' code resides.
  const { _sourcesPath } = event

  const reports = [
    {
      filename: 'baseData.json',
      generate: async function () {
        baseJson = await generateData.buildBaseJson( { _sourcesPath } )
      },
      skipSave: true
    },
    {
      filename: 'locations.json',
      generate: () => generateData.locations(baseJson)
    },
    {
      filename: 'timeseries-byLocation.json',
      generate: () => generateData.timeseriesByLocation(baseJson)
    },
    {
      filename: 'timeseries-jhu.csv',
      generate: () => generateData.timeseriesJhu(baseJson)
    },
    {
      filename: 'timeseries-tidy.csv',
      generate: () => generateData.timeseriesTidy(baseJson)
    },
    {
      filename: 'timeseries.csv',
      generate: () => generateData.timeseries(baseJson)
    }
  ]

  await Promise.all(reports.map(r => reportStatus(r.filename, 'pending')))

  for (const r of reports) {
    await doGeneration(r)
  }
}


exports.handler = arc.events.subscribe(handleEvent)
