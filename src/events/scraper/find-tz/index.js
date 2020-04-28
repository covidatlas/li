const assert = require('assert')
const iso1Codes = require('country-levels/iso1.json')
const usStates = require('@architect/shared/sources/_lib/geography/us-states.json')

/**
 * Find a source timezone, before scraping
 * Relies on static values, such as source.country and source.state
 */
module.exports = async function calculateScraperTz (source) {
  const { country, state, tz } = source

  // Some sources like JHU and NYT may already have a timezone specified
  if (tz) return tz

  // The US uses FIPS for its >3,000 counties
  if (country === 'iso1:US') {
    assert(!usStates[state], `Long form of state name used: ${state}, ${source._path}`)

    // iso2.json is kinda big, only load it if we need it
    // eslint-disable-next-line
    const iso2Codes = require('country-levels/iso2.json')

    // Handle iso2-tagged state params
    const stateCode = state.startsWith('iso2:') ? state.substr(5) : `US-${state}`
    const stateData = iso2Codes[stateCode]
    assert(stateData, `State data not found for ${state}, ${source._path}`)
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
  else {
    const rawCountry = country.replace('iso1:', '')
    if (iso1Codes[rawCountry]) {
      const countryData = iso1Codes[rawCountry]
      assert(countryData.timezone, `Country missing timezone information ${country}`)
      return countryData.timezone
    }
  }

  throw Error('Timezone not found; we must know the timezone of the source')
}
