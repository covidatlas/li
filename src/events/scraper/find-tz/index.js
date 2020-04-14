const assert = require('assert')
const iso1Codes = require('country-levels/iso1.json')
const usStates = require('../vendor/usa-states.json')

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

  // The US uses FIPS for its >3,000 counties
  if (country === 'iso1:US') {
    assert(!usStates[state], `Long form of state name used: ${state}, ${location._path}`)

    // iso2.json is kinda big, only load it if we need it
    // eslint-disable-next-line
    const iso2Codes = require('country-levels/iso2.json')

    const stateCode = `US-${state}`
    const stateData = iso2Codes[stateCode]
    assert(stateData, `State data not found for ${state}, ${location._path}`)
    assert(stateData.timezone, `State missing timezone information ${state}`)
    return stateData.timezone
  }

  // First try the state
  else if (state && state.startsWith('iso2:')) {
    // iso2.json is kinda big, only load it if we need it
    // eslint-disable-next-line
    const iso2Codes = require('country-levels/iso2.json')

    if (iso2Codes[state.substr(5)]) {
      const stateData = iso2Codes[state.substr(5)]
      assert(stateData.timezone, `State missing timezone information ${state}`)
      return stateData.timezone
    }
  }

  // Fall back to a national timezone
  else if (iso1Codes[country]) {
    const countryData = iso1Codes[country]
    assert(countryData.timezone, `Country missing timezone information ${country}`)
    return countryData.timezone
  }

  throw Error('Timezone not found; we must know the timezone of the source')
}
