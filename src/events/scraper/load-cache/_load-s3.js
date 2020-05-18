const { gunzipSync } = require('zlib')
const aws = require('aws-sdk')
const getCacheBucket = require('@architect/shared/utils/cache-bucket.js')
const getDatedFolders = require('./_get-dated-folders.js')

const isLocal = process.env.NODE_ENV === 'testing'

const s3 = new aws.S3()
const Bucket = getCacheBucket()

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
    const listObjects = isLocal
      ? s3.makeUnauthenticatedRequest('listObjectsV2', listParams)
      : s3.listObjectsV2(listParams)
    const objects = await listObjects.promise()
    for (const folder of objects.CommonPrefixes) {
      // folder.Prefix will be the full path, including the _sourceKey,
      // e.g. "kr/2020-05-18/"
      const f = folder.Prefix.split('/').
            filter(p => p).  // Remove empty end entry
            splice(1).       // Drop the _sourceKey
            join('/')
      folders.push(f)
    }
    // Recurse if necessary
    if (objects.IsTruncated) {
      await list(objects.NextContinuationToken)
    }
  }
  await list()

  return folders
}

/** Get the time folders under the sourceKey's date folders. */
async function getTimeFolders (params) {
  const { _sourceKey, folders } = params

  // Gather yesterday (UTC+), today, and tomorrow (UTC-).
  let timefolders = []
  const cacheDirs = getDatedFolders(params)
  for (const cacheDir of cacheDirs) {
    if (folders[cacheDir] !== undefined) {
      const result = await getFolders(_sourceKey + '/' + folders[cacheDir])
      timefolders = timefolders.concat(result)
    }
  }
  return timefolders
}

/** Get all file names in the given folder. */
async function getFiles (params) {
  const { _sourceKey, folder } = params

  let keys = []
  const Prefix = `${_sourceKey}/${folder}/`
  let listParams = {
    Bucket,
    Prefix
  }
  const listObjects = isLocal
    ? s3.makeUnauthenticatedRequest('listObjectsV2', listParams)
    : s3.listObjectsV2(listParams)
  const objects = await listObjects.promise()
  if (objects.Contents.length) {
    for (const file of objects.Contents) {
      keys.push(file.Key)
    }
  }

  let files = keys.map(k => k.split('/').pop())
  return files
}

async function getFileContents (params) {
  const { _sourceKey, folder, file } = params
  const Key = [ _sourceKey, folder, file ].join('/')

  let getParams = {
    Bucket,
    Key
  }
  const getObject = isLocal
    ? s3.makeUnauthenticatedRequest('getObject', getParams)
    : s3.getObject(getParams)
  const object = await getObject.promise()

  // Should always be gzipped, but jic
  return Key.endsWith('.gz') ? gunzipSync(object.Body) : object.Body
}

module.exports = {
  getFolders,
  getTimeFolders,
  getFiles,
  getFileContents
}
