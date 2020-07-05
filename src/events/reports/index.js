const arc = require('@architect/functions')
const { gzipSync } = require('zlib')
const getBaseJson = require('./generate-data/_build-base-json.js')
const generateData = require('./generate-data/index.js')
const { getWriter } = require('./write/index.js')


/** Post a status update. */
async function reportStatus (filename, status, params = {}) {
  const rpt = { report: filename, status, ...params }
  rpt.updated = new Date().toISOString()
  await arc.tables().
    then(data => data['report-status'].put(rpt))
  console.log(`Report ${filename}: ${status}`)
}


/** Generate and save a report, updating the status. */
async function doGeneration (hsh, folder) {
  const filename = hsh.filename

  try {
    await reportStatus(filename, 'generating')
    const data = await hsh.generate()
    await reportStatus(filename, 'saving')
    const writer = getWriter()
    await writer.write( { data, filename, folder } )
    await reportStatus(filename, 'success')
  }
  catch (err) {
    const errMsg = [ err.message, err.stack ].join('\n')
    await reportStatus(filename, 'failed', { error: errMsg })
  }
}

/** Report status during generation of baseData.json. */
async function updateBaseJsonStatus (index, total) {
  if (index % 100 !== 0)
    return
  reportStatus('baseData.json', `generating (${index + 1} of ${total})`)
}


/** Get the folder to write the reports to. */
function getReportFolder (_writeDir) {
  if (process.env.NODE_ENV === 'testing') {
    if (!_writeDir)
      throw new Error('_writeDir not specified')
    return _writeDir
  }

  // Folder for lambda.
  return '/tmp'
}


/**
 * Generate a report.
 */
async function handleEvent (event) {

  // All reports depend on baseJson, it must be generated first.
  let baseJson = null

  // Integration tests can override where sources' code resides.
  // When running locally, specify _writeDir where reports will be written.
  const { _sourcesPath, _writeDir } = event

  const reports = [
    {
      filename: 'baseData.json',
      generate: async function () {
        baseJson = await getBaseJson({ _sourcesPath }, updateBaseJsonStatus)
        return JSON.stringify(baseJson, null, 2)
      }
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
      filename: 'timeseries-tidy.csv.gz',
      generate: () => gzipSync(generateData.timeseriesTidy(baseJson))
    },
    {
      filename: 'timeseries.csv',
      generate: () => generateData.timeseries(baseJson)
    }
  ]

  await Promise.all(reports.map(r => reportStatus(r.filename, 'pending')))

  const folder = getReportFolder(_writeDir)
  for (const r of reports) {
    await doGeneration(r, folder)
  }
}


exports.handler = arc.events.subscribe(handleEvent)
