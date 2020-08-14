const aws = require('aws-sdk')
const mime = require('mime')
const getReportsBucket = require('@architect/shared/utils/reports-bucket.js')

async function write (params) {
  const { data, filename } = params

  const Bucket = getReportsBucket()
  const key = `v1/latest/${filename}`
  const putParams = {
    ACL: 'public-read',
    Bucket,
    Key: key,
    Body: Buffer.from(data),
    ContentType: mime.getType(filename)
  }
  const s3 = new aws.S3()
  const put = s3.putObject(putParams)
  await put.promise()

  const archiveDate = new Date().toISOString().slice(0, 10)
  const copyKey = `v1/${archiveDate}/${filename}`
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

module.exports = {
  write
}
