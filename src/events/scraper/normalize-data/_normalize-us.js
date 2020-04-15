const usStates = require('@architect/shared/sources/_lib/geography/us-states.json')

// Ensure county name consistency once isolated to a state
const norm = str => str.replace(/ /g, '').toLowerCase()

module.exports = function lookupFIPS (location) {
  const { country, state, county } = location
  if (country === 'iso1:US') {
    /**
     * Normalize states
     */
    if (state) {
      location.state = usStates[state] || state
      const iso2State = `US-${location.state}`

      // iso2.json is kinda big, only load it if we need it
      // eslint-disable-next-line
      const iso2Codes = require('country-levels/iso2.json')

      if (iso2Codes[iso2State]) {
        location.state = iso2Codes[iso2State].countrylevel_id
      }
    }

    /**
     * Normalize counties
     */
    // Possible FIXME: may need to add "subcounty" support for older AK datasets?
    // TODO change startsWith to Zsolt's fips lookup helper
    if (county && !county.startsWith('fips:')) {

      // fips.json is kinda big, only load it if we need it
      // eslint-disable-next-line
      const fipsCodes = require('country-levels/fips.json')

      const fips = Object.keys(fipsCodes).find(c => {
        const fip = fipsCodes[c]

        // Match the postal code abbreviation ("CA")
        const stateMatches = fip.state_code_postal === state

        // Match the normalized county name ("sanfranciscocounty")
        let countyMatches = norm(fip.name) === norm(county)

        // Looks like we've got a wonky one, try to strip out all known stuff
        if (!countyMatches) {
          const replacer = str => norm(str).replace('county', '')
                                           .replace('parish', '')
                                           .replace('municipality', '')
                                           .replace('borough', '')
                                           .replace('censusarea', '')
          countyMatches = replacer(fip.name) === replacer(county)
        }

        return stateMatches && countyMatches
      })

      // These are cases where an impacted individual may not belong to a specific county, but is still counted
      // 'unassigned' county is special / reserved
      if (norm(county) === 'unknown') {
        location.county = 'unassigned'
        return location
      }

      if (!fips) {
        const info = JSON.stringify(location, null, 2)
        throw Error(`Could not associate county with FIPS code: ${info}`)
      }

      location.county = `fips:${fips}`
    }

    return location
  }
  else return location
}
