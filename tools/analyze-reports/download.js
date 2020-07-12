const aws = require('aws-sdk')
const getReportsBucket = require('../../src/shared/utils/reports-bucket.js')
const fs = require('fs')
const path = require('path')


/**
 * Utils
 */


/** Download file from s3 */
async function downloadFile (bucketName, key, saveTo) {
  const params = {
    Bucket: bucketName,
    Key: key
  }
  const s3 = new aws.S3()
  console.log(`downloading ${key} from ${bucketName} ...`)
  let data = null
  try {
    data = await s3.getObject(params).promise()
    console.log('done')
  }
  catch (err) {
    console.log('error')
    console.log(err)
    throw err
  }

  const saveToFilePath = path.join(saveTo, key.split('/').slice(-1)[0])
  fs.writeFileSync(saveToFilePath, data.Body.toString())
  console.log(`Wrote ${saveToFilePath}`)
}


/**
 * Main
 */


async function main () {
  const saveTo = path.join(__dirname, 'downloadedReports')
  if (!fs.existsSync(saveTo)){
    fs.mkdirSync(saveTo)
  }

  await downloadFile(getReportsBucket('production'), 'beta/latest/timeseries-byLocation.json', saveTo)
}


main()
