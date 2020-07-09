/**
 * CloudFormation generated bucket names
 */
module.exports = function getReportsBucket (environment = process.env.NODE_ENV) {
  return (environment !== 'production') ?
    'listaging-reportsbucket-1bjqfmfwopcdd' :
    'liproduction-reportsbucket-bhk8fnhv1s76'
}
