const getSource = require('@architect/shared/sources/_lib/get-source.js')

// TODO (reports) this won't work if maintainers have the same name.
function getMaintainers (sources, params) {
  const maintainersHash = sources.
        map(s => getSource( { source: s, ...params } ).maintainers || []).
        flat().
        reduce((hsh, m) => { return { ...hsh, [m.name]: m } }, {})
  return Object.values(maintainersHash)
}

/** Get locations.
 *
 * Pass in params._sourcesPath to override the default sources path,
 * useful for integration testing. */
async function locations (baseJson, params = {}) {
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)
    for (const f of [ 'timeseries', 'timeseriesSources', 'warnings' ]) {
      delete rec[f]
    }
    const maintainers = getMaintainers(rec.sources, params)
    if (maintainers.length > 0)
      rec.maintainers = maintainers
    return rec
  })
}

module.exports = {
  locations
}
