const aws = require('aws-sdk')
const stream = require('stream')
const getReportsBucket = require('@architect/shared/utils/reports-bucket.js')

async function writeFile (filename, data) {
  const s3 = new aws.S3()

  const Bucket = getReportsBucket()

  const key = [ 'beta', 'latest', filename ].join('/')

  const params = {
    ACL: 'public-read',
    Bucket,
    Key: key,
    Body: data
  }

  const put = s3.putObject(params)
  await put.promise()

  const archiveDate = new Date().toISOString().slice(0, 10)
  const copyKey = [ 'beta', archiveDate, filename ].join('/')
  console.log(`Copying /${key} to ${copyKey}`)
  const copyParams = {
    CopySource: `/${Bucket}/${key}`,
    Bucket,
    Key: copyKey
  }
  const s3copy = s3.copyObject(copyParams)
  await s3copy.promise()

  console.log(`Wrote to S3: ${filename}`)
}


function getWritableStream (filename) {
  var pass = new stream.PassThrough()

  const Bucket = getReportsBucket()

  const Key = [ 'beta', 'latest', filename ].join('/')

  const params = {
    ACL: 'public-read',
    Bucket,
    Key,
    Body: pass
  }

  const s3 = new aws.S3()
  const promise = s3.upload(params, function (err, data) {
    console.log(`Error: ${err}\nData: ${data}`)
    throw err
  }).promise()

  return {
    writestream: pass,
    promise
  }
}


async function copyFileToArchive (filename) {
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
  const s3copy = s3.copyObject(copyParams)
  await s3copy.promise()
}


module.exports = {
  writeFile,
  getWritableStream,
  copyFileToArchive
}
