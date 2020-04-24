const assert = require('assert')
const iso2 = require('country-levels/iso2.json')

/**
 * Sometimes folks don’t sum numbers properly, so give them 10% slack.
 * @param {object} options - Options for the assertion.
 * @param {string} options.country - The iso1 country code to match within (iso1:AU)
 * @param {object} options.specialCases - Any special cases to replace before the matching process ({"Australian Capital Territory": "Aus Cap Ter"})
 * @returns {function} - A function that returns the iso2 value when given a name.
 */
const buildGetIso2FromName = ({ country, specialCases }) => {
  const iso2WithinIso1 = Object.values(iso2).filter(item => item.iso2.startsWith(country.replace('iso1:', '')))
  return name => {
    const modifiedName = specialCases[name] || name
    const foundItem = iso2WithinIso1.find(({ name }) => name.startsWith(modifiedName))
    assert(foundItem, `no item found for ${name} in ${country}`)
    return foundItem.countrylevel_id
  }
}
module.exports = buildGetIso2FromName
