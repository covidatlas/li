const arc = require('@architect/functions')
const generateData = require('./generate-data/index.js')
const writeReports = require('./write-reports/index.js')
const { getWritableStream, copyFileToArchive } = require('./write/index.js')


/** Post a status update. */
async function reportStatus (filename, status, params = {}) {
  const rpt = { report: filename, status, ...params }
  rpt.updated = new Date().toISOString()
  await arc.tables().
    then(data => data['report-status'].put(rpt))
  console.log(`Report ${filename}: ${status}`)
}


/** Generate and save a report, updating the status. */
async function doGeneration (hsh) {
  const f = hsh.filename

  let result = null
  try {
    await reportStatus(f, 'generating')

    let s = null
    if (!hsh.skipSave)
      s = getWritableStream(f)

    await hsh.generate(s)

    if (!hsh.skipSave) {
      s.end()
      await copyFileToArchive(f)
    }

    await reportStatus(f, 'success')
  }
  catch (err) {
    const errMsg = [ err.message, err.stack ].join('\n')
    await reportStatus(f, 'failed', { error: errMsg })
    return result
  }
}

/** Report status during generation of baseData.json.
 *
 * This report takes a while to build currently, due to a naive
 * implementation (of mine).  Report status during generation for
 * visibility. */
async function updateBaseJsonStatus (index, total) {
  if (index % 100 !== 0)
    return
  reportStatus('baseData.json', `generating (${index + 1} of ${total})`)
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
        baseJson = await generateData.buildBaseJson( { _sourcesPath }, updateBaseJsonStatus )
      },
      skipSave: true
    },
    {
      filename: 'locations.json',
      generate: async (s) => await writeReports.locations(baseJson, s)
    },
    {
      filename: 'timeseries-byLocation.json',
      generate: async (s) => await writeReports.timeseriesByLocation(baseJson, s)
    },
    {
      filename: 'timeseries-jhu.csv',
      generate: async (s) => await writeReports.timeseriesJhu(baseJson, s)
    },
    {
      filename: 'timeseries-tidy.csv.gz',
      generate: async (s) => await writeReports.timeseriesTidy(baseJson, s)
    },
    {
      filename: 'timeseries.csv',
      generate: async (s) => await writeReports.timeseries(baseJson, s)
    }
  ]

  await Promise.all(reports.map(r => reportStatus(r.filename, 'pending')))

  for (const r of reports) {
    await doGeneration(r)
  }
}


exports.handler = arc.events.subscribe(handleEvent)
