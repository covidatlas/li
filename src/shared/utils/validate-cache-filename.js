const { extensions } = require('../sources/_lib/crawl-types.js')

/**
 * It shouldn't really be feasible that we'd
 * be passed a bad cache filename because the filenames we pass to S3 should be solid (and are tested).
 * That said, during the cache migration from CDS → Li
 * there was plenty of potential for breakage,
 * so this exists (for now) to help keep things tight.
 */
module.exports = function validateCacheFilename (filename) {
  const check = /^\d{4}-\d{2}-\d{2}t\d{2}_\d{2}_\d{2}\.\d{3}[Zz]-[a-z]+(-\d+)?-[a-h0-9]{5}\..*$/

  // Check general shape
  if (!check.test(filename)) {
    throw new Error(`Bad cache filename: ${filename}`)
  }

  // Check extensions
  const exts = Object.values(extensions)
  const parts = filename.split('/')
  // If there are folders, skip to the filename
  const fileparts = parts[parts.length - 1].split('-')
  const ext = fileparts.splice(-1)[0].split('.')[1]
  if (!exts.some(a => a === ext)) {
    throw new Error(`Bad cache extension: ${filename}`)
  }
}
