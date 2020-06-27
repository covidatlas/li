const aws = require('aws-sdk')
const getReportsBucket = require('@architect/shared/utils/reports-bucket.js')

module.exports = async function writeS3 (data, filename) {
  const s3 = new aws.S3()

  const Bucket = getReportsBucket()

  const params = {
    ACL: 'public-read',
    Bucket,
    Key: filename,
    Body: data
  }

  const put = s3.putObject(params)
  await put.promise()

  console.log(`Wrote to S3: ${filename}`)
}
