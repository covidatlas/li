/**
 * @param {{ cases?: number; deaths?: number; recovered?: number; testedNegative?: number; tested?: number }} inputData
 */
const getDataWithTestedNegativeApplied = inputData => {
  const data = { ...inputData }
  if (!data.tested && data.testedNegative > 0) {
    data.tested = data.testedNegative + data.cases
    delete data.testedNegative
  }
  return data
}

module.exports = getDataWithTestedNegativeApplied
