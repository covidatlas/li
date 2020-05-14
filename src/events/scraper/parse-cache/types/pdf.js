const PDFParser = require('pdf2json')

/**
 * Parse a PDF from a buffer
 *
 * @param {*} data the PDF buffer to parse
 * @return a null terminated array of text elements. Each element contains the following:
 * - x: x position of the text element in pixels
 * - y: y position of the text element in pixels
 * - w: width of the text element in pixels
 * - text: the text contained in this element
 * - page: the page number this element is situated in
 */
module.exports = async function parsePDF (params) {
  const { content } = params

  return new Promise((resolve, reject) => {
    const parser = new PDFParser()

    parser.parseBuffer(content)
    parser.on('pdfParser_dataError', err => reject(err.parserError))
    parser.on('pdfParser_dataReady', pdfData => {
      const parsed = []
      let pageNumber = 1
      for (const page of pdfData.formImage.Pages || []) {
        for (const textItem of page.Texts || []) {
          const text = textItem.R.reduce((str, t) => str + t.T, '')
          // We receive text with URI characters (such as %20). We need to decode them
          const decodedText = decodeURI(text)

          parsed.push({
            page: pageNumber,
            x: textItem.x,
            y: textItem.y,
            w: textItem.w,
            text: decodedText.trim()
          })
        }
        pageNumber += 1
      }

      // Our utils functions expect a null object at the end of the document
      parsed.push(null)

      // This is key, forget it and you'll run into an out of memory error
      parser.destroy()

      resolve(parsed)
    })
  })
}
