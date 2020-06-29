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

  // The reports to generate depend on baseJson, but we need to define
  // them and their generation routines beforehand so that we can set
  // them all to pending.  We can't create them with an enclosure b/c
  // we generate the base data and so reassign its variable.  Storing
  // the data in this dict so that the genBaseJson call can store its
  // value here, and then the subsequent generation steps can pull
  // their data from here.
  const sourceData = {
    baseJson: null
  }

  // Integration tests can override where sources' code resides.
  const { _sourcesPath } = event

  const genBaseJson = {
    filename: 'baseData.json',
    generate: async function () {
      const base = await generateData.buildBaseJson( { _sourcesPath } )
      sourceData.baseJson = base
      return base
    },
    skipSave: true
  }

  const reports = [
    {
      filename: 'locations.json',
      generate: () => generateData.locations(sourceData.baseJson)
    },
    {
      filename: 'timeseries-byLocation.json',
      generate: () => generateData.timeseriesByLocation(sourceData.baseJson)
    },
    {
      filename: 'timeseries-jhu.csv',
      generate: () => generateData.timeseriesJhu(sourceData.baseJson)
    },
    {
      filename: 'timeseries-tidy.csv',
      generate: () => generateData.timeseriesTidy(sourceData.baseJson)
    },
    {
      filename: 'timeseries.csv',
      generate: () => generateData.timeseries(sourceData.baseJson)
    }
  ]

  // All are pending at the start
  const rptNames = reports.concat(genBaseJson).map(r => r.filename)
  await Promise.all(rptNames.map(n => reportStatus(n, 'pending')))

  await doGeneration(genBaseJson)
  for (const r of reports) {
    await doGeneration(r)
  }
}


exports.handler = arc.events.subscribe(handleEvent)
