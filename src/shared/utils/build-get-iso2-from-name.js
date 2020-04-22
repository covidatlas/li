const assert = require('assert')
const iso2 = require('country-levels/iso2.json')

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
