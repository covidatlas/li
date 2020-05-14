/**
 * Parse some JSON
 * @param {*} data the JSON payload to parse
 */
module.exports = function json (params) {
  const { content } = params
  return JSON.parse(content)
}
