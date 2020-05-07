const aws = require('aws-sdk')
const { join } = require('path')
const { gzipSync } = require('zlib')
const getCacheBucket = require('@architect/shared/utils/cache-bucket.js')

module.exports = async function writeS3 (data, filepath, filename) {
  const s3 = new aws.S3()

  const Bucket = getCacheBucket()
  const Key = join(filepath, `${filename}.gz`)
  const Body = gzipSync(data)

  const params = {
    ACL: 'public-read',
    Bucket,
    Key,
    Body
  }

  const put = s3.putObject(params)
  await put.promise()

  console.log(`Wrote to S3 cache: ${Key}`)
}
