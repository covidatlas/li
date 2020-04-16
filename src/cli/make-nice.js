const { sep } = require('path')
const loadSources = require('../../src/shared/sources/_lib/load-sources.js')

/**
 * Enable:
 * --[source|crawl|scrape] 'nl' instead of 'nl/index.js'
 * --[source|crawl|scrape] 'us/ca/san-francisco-county' instead of 'us/ca/san-francisco-county.js'
 */
module.exports = function makeNice (params) {
  let { source, crawl, scrape, regenerate } = params

  if (crawl || scrape || source || regenerate) {
    const sources = loadSources().map(s => s.split(`shared${sep}sources`)[1].substr(1))
    const makeNice = p => {
      const exact = sources.find(s => p === s)
      if (exact) return exact

      const sansJs = sources.find(s => p === s.replace('.js', ''))
      if (sansJs) return sansJs

      const sansIndexJs = sources.find(s => p === s.replace(`${sep}index.js`, ''))
      if (sansIndexJs) return sansIndexJs
    }
    if (source) source = makeNice(source)
    if (crawl) crawl = makeNice(crawl)
    if (scrape) scrape = makeNice(scrape)
    if (regenerate) regenerate = makeNice(regenerate)
  }
  if (regenerate === '') {
    regenerate = true
  }
  return { source, crawl, scrape, regenerate }
}
