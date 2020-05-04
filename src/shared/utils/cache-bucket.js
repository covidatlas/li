/**
 * These are CloudFormation generated bucket names
 * Normally we'd use `ARC_STORAGE_PUBLIC_CACHE` but we want to ensure local workflows without .arc-config
 */
module.exports = function getCacheBucket () {
  const isProduction = process.env.NODE_ENV === 'production'
  return isProduction
    ? 'liproduction-cachebucket-47bz46vqox3a'
    : 'listaging-cachebucket-ytmnslhoqzje'
}
