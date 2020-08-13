const XLSX = require('xlsx')

/**
 * Parse an XLSX file from a buffer
 *
 * @param {*} data the PDF buffer to parse
 * Returns the worksheet (ref https://www.npmjs.com/package/xlsx)
 * Adds worksheet.json, dict of all sheets json-ified, keyed on sheet name.
 */
module.exports = async function parseXlsx (params) {
  const { content } = params
  const workbook = XLSX.read(content, { type: 'buffer' })

  // Add non-raw json sheets as a convenience.
  workbook.json = workbook.SheetNames.reduce((hsh, s) => {
    const worksheet = workbook.Sheets[s]
    hsh[s] = XLSX.utils.sheet_to_json(worksheet, { raw: false })
    return hsh
  }, {})

  return workbook
}
