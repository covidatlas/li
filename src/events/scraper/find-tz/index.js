const assert = require('assert')
const iso2Codes = require('country-levels/iso2.json')
const usStates = require('./usa-states.json')

/**
 * Find a location timezone, before scraping
 * Relies on static values, such as location.country and location.state
 */
module.exports = async function calculateScraperTz (location) {
  // Some sources like JHU and NYT may already have this specified
  if (location.scraperTz) {
    return location.scraperTz
  }

  const { country, state } = location

  if (country === 'iso1:US') {
    assert(!usStates[state], `calculateScraperTz: Long form of state name used: ${state}, ${location._path}`)
    const stateCode = `US-${state}`
    const stateData = iso2Codes[stateCode]
    assert(stateData, `calculateScraperTz: State data not found for ${state}, ${location._path}`)
    assert(stateData.timezone, `calculateScraperTz: State missing timezone informatin ${state}`)
    return stateData.timezone
  }

  return 'UTC'
}
