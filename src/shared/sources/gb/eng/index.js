const parse = require('../../_lib/parse.js')

const gssCodeMap = require('../_shared.js')

module.exports = {
  country: 'iso1:GB',
  state: 'iso2:GB-ENG',
  aggregate: 'county',
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'csv',
          url: 'https://www.arcgis.com/sharing/rest/content/items/b684319181f94875a6879bbc833ca3a6/data'
        }
      ],
      scrape(data) {
        const counties = []

        const codeMap = gssCodeMap()

        for (const row of data) {
          const gss = row.GSS_CD
          const iso = codeMap[gss]
          if (!iso) {
            console.error(`GB/ENG: ${row.GSS_CD} not found in GSS codes`)
            continue
          }

          const clId = `iso2:${iso}`

          counties.push({
            county: clId,
            cases: parse.number(row.TotalCases)
          })
        }
        return counties
      }
    }
  ]
}
