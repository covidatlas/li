const XLSX = require('xlsx')

/**
 * Parse an XLSX file from a buffer
 *
 * @param {*} data the PDF buffer to parse
 * Returns the worksheet (ref https://www.npmjs.com/package/xlsx)
 * Adds worksheet.json, dict of all sheets json-ified, keyed on sheet name.
 */
module.exports = async function parseXlsx (params) {
  const cl = console.log
  cl('parsing ...')
  const { content } = params
  cl('reading ...')
  const workbook = XLSX.read(content, { type: 'buffer' })

  cl('adding json for sheets')
  workbook.json = workbook.SheetNames.reduce((hsh, s) => {
    const worksheet = workbook.Sheets[s]
    hsh[s] = XLSX.utils.sheet_to_json(worksheet)
    return hsh
  }, {})

  return workbook
}
