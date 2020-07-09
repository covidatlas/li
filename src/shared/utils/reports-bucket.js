/**
 * CloudFormation generated bucket names
 */
module.exports = function getReportsBucket () {
  const isProduction = process.env.NODE_ENV === 'production'
  if (!isProduction)
    return 'listaging-reportsbucket-1bjqfmfwopcdd'
  return 'liproduction-reportsbucket-bhk8fnhv1s76'
}
