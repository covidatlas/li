/**
 * Pass raw data through as text
 * @param {*} data
 */
module.exports = function json (params) {
  const { content } = params
  // toString probably not necessary but do it jic to guard against upstream changes
  return content.toString('utf8')
}
