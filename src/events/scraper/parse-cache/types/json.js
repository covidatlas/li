/**
 * Parse some JSON
 * @param {*} data the JSON payload to parse
 */
module.exports = function json (params) {
  const { data } = params
  return JSON.parse(data)
}
