// Migrated from coronadatascraper, src/shared/scrapers/US/CA/san-benito-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06069',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'page',
          url: 'https://hhsa.cosb.us/publichealth/communicable-disease/coronavirus/',
        },
      ],
      scrape ($) {
        const $table = $('h1:contains("San Benito County COVID-19 Case Count")')
              .nextAll('table')
              .first()
        function valueFor (title) {
          const v = $table.
                find(`td:contains("${title}")`).
                next('td').
                text()
          return parse.number(v)
        }
        return {
          cases: valueFor('Positive'),
          deaths: valueFor('Deaths'),
          recovered: valueFor('Recovered')
        }
      }
    },
    {
      // TODO (scrapers): need to scrape arcgis
      startDate: '2020-03-19',
      crawl: [
        {
          // This URL is not valid, but validation is complaining.
          type: 'page',
          url: 'https://hhsa.cosb.us/publichealth/communicable-disease/coronavirus/',
        }
      ],
      // eslint-disable-next-line
      scrape (data) {
        throw new Error('Not implemented, need to scrape new arcgis')
      }
    },
    {
      // TODO (scrapers): scrape arcgis page
      startDate: '2020-05-20',
      crawl: [
        {
          type: 'headless',
          data: 'paragraph',
          // This URL was used by an iframe in
          // https://hhsa.cosb.us/publichealth/communicable-disease/coronavirus/.
          // It may be constant or may vary, not sure.  Am only
          // porting this to Li, so this is a future TODO.
          url: 'https://cosb.maps.arcgis.com/apps/MapSeries/index.html?appid=91881d5ff0184577860db10ebcdac928'
        }
      ],
      // eslint-disable-next-line
      scrape ($) {
        throw new Error('Not implemented, need to scrape new arcgis')
      }
    }
  ]
}
