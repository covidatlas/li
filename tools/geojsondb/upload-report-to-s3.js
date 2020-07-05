/** Load the features.json report to s3. */

const getReportsBucket = require('./../../src/shared/utils/reports-bucket.js')
const aws = require('aws-sdk')
const path = require('path')
const fs = require('fs')

async function upload (file) {
  const s3 = new aws.S3()

  const Bucket = getReportsBucket()

  // TODO (reports) extract code for common reports folder
  const key = [ 'beta', 'latest', 'features.json' ].join('/')

  const putParams = {
    ACL: 'public-read',
    Bucket,
    Key: key,
    Body: Buffer.from(fs.readFileSync(file))
  }

  console.log('Uploading ...')
  const put = s3.putObject(putParams)
  await put.promise()
}


;(async () => {
  const file = path.join(__dirname, 'features.json')
  if (!fs.existsSync(file)) {
    console.log('Missing file features.json in this directory.')
    process.exit(1)
  }

  await upload(file)

  console.log('Uploaded features.json')
})()
