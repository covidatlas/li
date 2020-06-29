/**
 * CloudFormation generated bucket names
 */
module.exports = function getReportsBucket () {
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction)
    return 'listaging-reportsbucket-1bjqfmfwopcdd'

  // TODO (reports) need proper bucket names.
  throw new Error('TODO need prod key in src/shared/utils/reports-bucket.js')
}
