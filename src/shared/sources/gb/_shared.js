const gssCodes = require('./gss-codes.json')

// GSS code to ISO code in Wikidata: https://w.wiki/MQ3

// TODO (JZ) remove this comment, had to add it for testing.
// eslint-disable-next-line import/prefer-default-export
module.exports = function gssCodeMap() {
  const codeMap = {}
  for (const row of gssCodes) {
    const { isoCode, gss } = row
    codeMap[gss] = isoCode
  }
  // custom code for Bournemouth, Christchurch and Poole
  codeMap.E06000058 = 'GB-XBCP'
  return codeMap
}
