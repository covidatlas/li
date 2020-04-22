/**
 * Pass raw data through as text
 * @param {*} data
 */
module.exports = function json (params) {
  const { data } = params
  // toString probably not necessary but do it jic to guard against upstream changes
  return data.toString('utf8')
}
