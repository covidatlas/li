const arc = require('@architect/functions')
const fs = require('fs')
const path = require('path')
const aws = require('aws-sdk')
const generateData = require('./generate-data/index.js')
const writeReports = require('./write-reports/index.js')
// const getReportsBucket = require('@architect/shared/utils/reports-bucket.js')


// *******************************************************
// GET RID OF
// getReportsBucket
// and hacks
// remove xxx hack from if (process.env.NODE_ENV !== 'testing') {
// *******************************************************

// TODO get rid of this
function getReportsBucket () {
  return 'zzjzstagingtest12345'
}


/** Post a status update. */
async function reportStatus (filename, status, params = {}) {
  const rpt = { report: filename, status, ...params }
  rpt.updated = new Date().toISOString()
  await arc.tables().
    then(data => data['report-status'].put(rpt))
  console.log(`Report ${filename}: ${status}`)
}


function getWritableStream (reportPath, filename) {
  fs.mkdirSync(reportPath, { recursive: true })
  const file = path.join(reportPath, filename)
  return fs.createWriteStream(file)
}


function uploadToS3 (reportPath, filename) {
  const Bucket = getReportsBucket()
  const Key = [ 'beta', 'latest', filename ].join('/')

  const Body = fs.createReadStream(path.join(reportPath, filename))

  const params = {
    ACL: 'public-read',
    Bucket,
    Key,
    Body
  }

  const s3 = new aws.S3()
  s3.upload(params, function (err, data) {
    if (err) {
      console.log(`Error: ${err}\nData: ${data}`)
      throw err
    }
  })
}


async function copyToArchive (filename) {
  const s3 = new aws.S3()

  const Bucket = getReportsBucket()

  const key = [ 'beta', 'latest', filename ].join('/')

  const archiveDate = new Date().toISOString().slice(0, 10)
  const copyKey = [ 'beta', archiveDate, filename ].join('/')
  console.log(`Copying /${key} to ${copyKey}`)
  const copyParams = {
    CopySource: `/${Bucket}/${key}`,
    Bucket,
    Key: copyKey
  }
  s3.copyObject(copyParams, function (err, data) {
    if (err) {
      console.log(`Error: ${err}\nData: ${data}`)
      throw err
    }
  })
}


/** Generate and save a report, updating the status. */
async function doGeneration (hsh, folder) {
  const f = hsh.filename

  try {
    await reportStatus(f, 'generating')
    const writestream = getWritableStream(folder, f)
    console.log(`${f}: calling generate`)
    await hsh.generate(writestream)
    writestream.end()
    if (process.env.NODE_ENV !== 'testing') {
      console.log(`${f}: uploading to s3`)
      uploadToS3(folder, f)
      console.log(`${f}: copying to archive`)
      copyToArchive(f)
    }
    await reportStatus(f, 'success')
  }
  catch (err) {
    const errMsg = [ err.message, err.stack ].join('\n')
    await reportStatus(f, 'failed', { error: errMsg })
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
      generate: async function (s) {
        baseJson = await generateData.buildBaseJson( { _sourcesPath }, updateBaseJsonStatus )
        await s.write(JSON.stringify(baseJson, null, 2))
      }
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

  const folder = getReportFolder(_writeDir)
  for (const r of reports) {
    await doGeneration(r, folder)
  }
}


exports.handler = arc.events.subscribe(handleEvent)
