/**
 * Hand rolled version of _.groupBy
 *
 * @param {object[]} array
 * @param {(object) => string} func - Get the key to group by.
 * @returns {object} Where key is the result of the function, and the value is an array of the values that match.
 */
const groupBy = (array, func) => {
  return array.reduce((previousValue, currentValue) => {
    const currentKey = func(currentValue)
    const oldVersionOfCurrentKey = previousValue[currentKey] || []
    return { ...previousValue, [currentKey]: [ ...oldVersionOfCurrentKey, currentValue ] }
  }, {})
}

module.exports = groupBy
