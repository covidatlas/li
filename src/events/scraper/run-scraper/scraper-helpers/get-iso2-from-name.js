const assert = require('assert')
const slugify = require('slugify')
const iso2 = require('country-levels/iso2.json')
const { UNASSIGNED } = require('@architect/shared/sources/_lib/constants.js')

const slugifyOptions = { lower: true }

// Can be removed after https://github.com/simov/slugify/pull/76 is released.
slugify.extend({ 'ō': 'o' })

/**
 * Find ISO2 code within a country.
 * Guarantees non-ambiguous match (to avoid New York "City" or "State" problem).
 * @param {object} options - Options.
 * @param {object} options.isoMap - Ambiguous items, mapped directly to their iso2 values
 *   ({'Australian Capital Territory: 'iso2:AU-ACT'}). Use when > 1 match.
 * @param {object} options.nameToCanonical - Non canonical names mapped to canonical names
 *   ({'Aust. Capital Territory: 'Australian Capital Territory'}). Use when 0 match.
 * @param {string} options.country - The iso1 country code to match within (iso1:AU)
 * @param {string} options.name - The name to look up ("Australian Capital Territory")
 * @returns {string} - The iso2 ID ('iso2:AU-ACT').
 */
module.exports = function getIso2FromName (params) {
  const { isoMap, nameToCanonical, country, name } = params
  assert(name && name.length > 0, `name must be non-empty string, got '${name}'`)
  const countryCode = country.replace('iso1:', '')
  const iso2WithinIso1 = Object.values(iso2).filter(item => item.iso2.startsWith(countryCode))
  const nameForMatching = (nameToCanonical || {})[name] || name

  if (nameForMatching === UNASSIGNED) {
    return `iso2:${UNASSIGNED}`
  }

  const hardCodedIso2 = (isoMap || {})[name]
  if (hardCodedIso2 && hardCodedIso2.startsWith(`iso2:${countryCode}`)) {
    return hardCodedIso2
  }

  const slugName = slugify(nameForMatching, slugifyOptions)
  const foundItems = iso2WithinIso1.filter(
    (canonicalItem) => slugify(canonicalItem.name, slugifyOptions).includes(slugName)
  )
  assert.notEqual(foundItems.length, 0,
    `No match found for ${name} in ${country}. Use 'nameToCanonical' option to map ${name} to UNASSIGNED or one of the names at https://github.com/hyperknot/country-levels-export/blob/master/docs/iso2_list/${countryCode.toUpperCase()}.md`
  )

  assert.equal(foundItems.length, 1,
    `Multiple (${foundItems.length}) matches found for ${name} in ${country}. Use 'isoMap' option to map ${name} to one of the ISO2 values at https://github.com/hyperknot/country-levels-export/blob/master/docs/iso2_list/${countryCode.toUpperCase()}.md `
  )
  return foundItems[0].countrylevel_id
}
