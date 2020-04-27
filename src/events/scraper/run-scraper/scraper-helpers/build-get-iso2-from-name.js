const assert = require('assert')
const slugify = require('slugify')
const iso2 = require('country-levels/iso2.json')

const UNASSIGNED = '(unassigned)'

const slugifyOptions = { lower: true }

/**
 * Find ISO2 code within a country.
 * Guarantees non-ambiguous match (to avoid New York "City" or "State" problem).
 * @param {object} options - Options for the builder.
 * @param {string} options.country - The iso1 country code to match within (iso1:AU)
 * @returns {function} - A function that returns the iso2 value when given a name ('Australian Capital Territory' -> 'iso2:AU-ACT').
 */
const buildGetIso2FromName = ({ country }) => {
  const iso2WithinIso1 = Object.values(iso2).filter(item => item.iso2.startsWith(country.replace('iso1:', '')))
  return name => {
    if (name === UNASSIGNED) {
      return name
    }
    const slugName = slugify(name, slugifyOptions)
    const foundItems = iso2WithinIso1.filter((canonicalItem) => slugify(canonicalItem.name, slugifyOptions).includes(slugName))
    assert.equal(foundItems.length, 1,
      `no single match found for ${name} in ${country}. Found ${iso2WithinIso1.map((item) => item.name).join()}`
      )
    return foundItems[0].countrylevel_id
  }
}
module.exports = buildGetIso2FromName
