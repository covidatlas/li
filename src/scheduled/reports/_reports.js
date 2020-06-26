const getSource = require('@architect/shared/sources/_lib/get-source.js')
const utils = require('./_utils.js')

function addMaintainers (rec, sources) {
  // TODO (reports) this won't work if maintainers have the same name.
  const maintainers = sources.map(s => s.maintainers).flat()
  if (maintainers.length)
    rec.maintainers = utils.uniqueByKey(maintainers, 'name')
}

function removeFields (rec, fields) {
  for (const f of fields)
    delete rec[f]
}

/** locations.json source.
 *
 * Pass in params._sourcesPath to override the default sources path. */
async function locations (baseJson, params = {}) {
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)

    const sources = rec.sources.map(s => getSource({ source: s, ...params }))

    addMaintainers(rec, sources)

    const links = sources.map(s => s.friendly).flat()
    if (links.length)
      rec.links = utils.uniqueByKey(links, 'url')

    removeFields(rec, [ 'timeseries', 'timeseriesSources', 'warnings', 'area', 'created' ])

    return rec
  })
}


/** timeseries-byLocation.json source.
 *
 * Pass in params._sourcesPath to override the default sources path. */
async function timeseriesByLocation (baseJson, params = {}) {
  return baseJson.map(loc => {
    const rec = Object.assign({}, loc)

    const sources = rec.sources.map(s => getSource({ source: s, ...params }))

    addMaintainers(rec, sources)

    removeFields(rec, [ 'area', 'created' ])

    return rec
  })
}

module.exports = {
  locations,
  timeseriesByLocation
}
