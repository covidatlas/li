const assert = require('assert')

/**
 * Sometimes folks don’t sum numbers properly, so give them 10% slack.
 * @param {object} options - Options for the assertion.
 * @param {number} options.computed - The summed value.
 * @param {number} options.scraped - The scraped value to check against.
 */
const assertTotalsAreReasonable = ({ computed, scraped }) => {
  const isReasonable = computed * 0.9 < scraped && computed * 1.1 > scraped
  assert(scraped > 0, 'Scraped Total is not reasonable')
  assert(isReasonable, 'Computed total is not anywhere close to scraped total')
}

module.exports = assertTotalsAreReasonable
