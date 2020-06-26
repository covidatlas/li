
function uniqueByKey (arr, key) {
  const h = arr.reduce((hsh, m) => { return { ...hsh, [m[key]]: m } }, {})
  return Object.values(h)
}

module.exports = {
  uniqueByKey
}
