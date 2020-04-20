const aws = require('aws-sdk')
const { join } = require('path')
const { gzipSync } = require('zlib')

module.exports = async function writeS3 (data, filePath, filename) {
  aws.config.setPromisesDependency(null)

  const s3 = new aws.S3()

  const Bucket = `li-cache-${process.env.NODE_ENV}`
  const Key = join(filePath, `${filename}.gz`)
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
