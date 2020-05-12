/**
 * Sum/add-up per key.
 * @param {Object[]} items - Things to sum per key
 * @returns {Object} - Keys are all the number fields on the object.
 */
const cumulateObjects = items =>
  items.reduce((previous, item) => {
    const newObject = { ...previous }
    for (const [ key, value ] of Object.entries(item)) {
      if (typeof value !== 'number') {
        continue
      }
      if (!newObject[key]) {
        newObject[key] = value
        continue
      }
      newObject[key] += value
    }
    return newObject
  }, {})

module.exports = cumulateObjects
