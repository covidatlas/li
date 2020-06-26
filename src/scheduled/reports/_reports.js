const getSource = require('@architect/shared/sources/_lib/get-source.js')

function uniqueByKey (arr, key) {
  const h = arr.reduce((hsh, m) => { return { ...hsh, [m[key]]: m } }, {})
  return Object.values(h)
}

function addPopulationDensity (rec) {
  if (rec.population && rec.area && rec.area.landSquareMeters) {
    const pd = (rec.population / rec.area.landSquareMeters) * 1000000
    rec.populationDensity = Math.round(pd * 10000) / 10000
  }
}

/** Get locations.
 *
 * Pass in params._sourcesPath to override the default sources path,
 * useful for integration testing. */
async function locations (baseJson, params = {}) {
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)

    const sources = rec.sources.map(s => getSource({ source: s, ...params }))

    // TODO (reports) this won't work if maintainers have the same name.
    const maintainers = sources.map(s => s.maintainers).flat()
    if (maintainers.length)
      rec.maintainers = uniqueByKey(maintainers, 'name')

    const links = sources.map(s => s.friendly).flat()
    if (links.length)
      rec.links = uniqueByKey(links, 'url')

    addPopulationDensity(rec)
    delete rec.area

    const remove = [
      'timeseries', 'timeseriesSources', 'warnings', 'area', 'created'
    ]
    for (const f of remove)
      delete rec[f]

    return rec
  })
}

module.exports = {
  locations
}
