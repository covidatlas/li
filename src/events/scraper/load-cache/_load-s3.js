const { gunzipSync } = require('zlib')
const aws = require('aws-sdk')
aws.config.setPromisesDependency(null)
const getDatedFolders = require('./_get-dated-folders.js')

const env = process.env.NODE_ENV === 'production' ? 'production' : 'staging'

const s3 = new aws.S3()
const Bucket = `li-cache-${env}`

async function getFolders (_sourceKey) {
  // Hooray recursive fns ♾
  let folders = []
  async function list (token) {
    const Prefix = _sourceKey + '/'
    const Delimiter = '/'
    let listParams = {
      Bucket,
      Prefix,
      Delimiter,
      // MaxKeys: 1 // Uncomment to test recursion
    }
    if (token) listParams.ContinuationToken = token

    // Do the thing
    const listObjects = s3.listObjectsV2(listParams)
    const objects = await listObjects.promise()
    for (const folder of objects.CommonPrefixes) {
      folders.push(folder.Prefix.split('/')[1])
    }
    // Recurse if necessary
    if (objects.IsTruncated) {
      await list(objects.NextContinuationToken)
    }
  }
  await list()

  return folders
}

async function getFiles (params) {
  const { _sourceKey, folders } = params

  // Gather yesterday (UTC+), today, and tomorrow (UTC-)
  let keys = []
  const cacheDirs = getDatedFolders(params)
  for (const cacheDir of cacheDirs) {
    if (folders[cacheDir] !== undefined) {
      const Prefix = `${_sourceKey}/${folders[cacheDir]}/`
      let listParams = {
        Bucket,
        Prefix
      }
      const listObjects = s3.listObjectsV2(listParams)
      const objects = await listObjects.promise()
      if (objects.Contents.length) {
        for (const file of objects.Contents) {
          keys.push(file.Key)
        }
      }
    }
  }

  // The keys as gathered above are our final S3 paths to call
  // For now we need to filter by UTC dates, so re-map down to just the filenames
  let files = keys.map(k => k.split('/')[2])

  return { keys, files }
}

async function getFileContents (params) {
  const { keys, file } = params

  const Key = keys.find(k => k.endsWith(file))

  let getParams = {
    Bucket,
    Key
  }
  const getObject = s3.getObject(getParams)
  const object = await getObject.promise()

  // Should always be gzipped, but jic
  return Key.endsWith('.gz') ? gunzipSync(object.Body) : object.Body
}

module.exports = {
  getFolders,
  getFiles,
  getFileContents
}
