const assert = require('assert')

/**
 * @param {{$: any, tableSelector: string}} options
 */
const normalizeTable = ({ $, tableSelector }) => {
  const output = []

  const $rows = $(tableSelector).find('tr')
  $rows.each((rowIndex, row) => {
    const $columns = $(row).find('th, td')
    $columns.each((columnIndex, column) => {
      const $column = $(column)
      const rowSpan = Number.parseInt($column.attr('rowspan')) || 1
      const columnSpan = Number.parseInt($column.attr('colspan')) || 1
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

  return output
}

module.exports = normalizeTable
