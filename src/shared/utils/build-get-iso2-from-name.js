const assert = require('assert')
const slug = require('slug')
const iso2 = require('country-levels/iso2.json')

const UNASSIGNED = '(unassigned)'

const slugOptions = { lower: true }
/**
 * @param {object} options - Options for the resultant function.
 * @param {string} options.country - The iso1 country code to match within (iso1:AU)
 * @returns {function} - A function that returns the iso2 value when given a name.
 */
const buildGetIso2FromName = ({ country }) => {
  const iso2WithinIso1 = Object.values(iso2).filter(item => item.iso2.startsWith(country.replace('iso1:', '')))
  return name => {
    if (name === UNASSIGNED) {
      return name
    }
    const slugName = slug(name, slugOptions)
    const foundItems = iso2WithinIso1.filter((canonicalItem) => slug(canonicalItem.name, slugOptions).includes(slugName))
    assert.equal(foundItems.length, 1, `no single match found for ${name} in ${country}`)
    return foundItems[0].countrylevel_id
  }
}
module.exports = buildGetIso2FromName
