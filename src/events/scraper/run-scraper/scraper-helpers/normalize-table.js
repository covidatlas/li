const assert = require('assert')

/**
 * Extract a HTML <table> into an array of arrays of text.
 * This removes the need to use cheerio directly to manipulate inside the scraper.
 * It also normalises for rowspan and colspan, where the text is copied across each index in the span.
 *
 * Similar to cheerio-tableparser, but doesn't mirror the data structure,
 * has defaults that are appropriate for this project,
 * and throws where it can't yield a consistent data structure.
 * @param {{$: any, tableSelector: string, table: string}} options
 * @returns {string[][]} Array of arrays of strings, so you can iterate over rows, then columns.
 */
const normalizeTable = ({ $, tableSelector, table }) => {
  const output = []

  let $table = table
  if (!table)
    $table = $(tableSelector)

  assert(
    $table.length > 0,
    `No table found for selector "${tableSelector}"`
  )
  const $rows = $table.find('tr')
  $rows.each((rowIndex, row) => {
    const $columns = $(row).find('th, td')
    $columns.each((columnIndex, column) => {
      const $column = $(column)
      const rowSpan = Number.parseInt($column.attr('rowspan'), 10) || 1
      const columnSpan = Number.parseInt($column.attr('colspan'), 10) || 1
      const textValue = $column.text().trim()

      while (output[rowIndex] && output[rowIndex][columnIndex]) columnIndex++
      for (let rowIndexInLoop = rowIndex; rowIndexInLoop < rowIndex + rowSpan; rowIndexInLoop++) {
        output[rowIndexInLoop] = output[rowIndexInLoop] || []

        for (let columnIndexInLoop = 0; columnIndexInLoop < columnSpan; columnIndexInLoop++) {
          output[rowIndexInLoop][columnIndex + columnIndexInLoop] = textValue
        }
      }
    })
  })

  output.forEach(row => {
    assert.equal(row.length, output[0].length, 'Column count varies in output table')
  })

  assert(output.length > 0, 'Empty output from table normalization')

  return output
}

module.exports = normalizeTable
