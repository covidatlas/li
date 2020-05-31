// Migrated from coronadatascraper, src/shared/scrapers/US/CT/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

module.exports = {
  state: 'iso2:US-CT',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.qgolsteyn ],
  friendly:   {
    url: 'https://portal.ct.gov/dph',
    name: 'Connecticut State DPH',
    description: 'Connecticut State Department of Public Health',
  },
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          url: 'https://portal.ct.gov/Coronavirus',
        },
      ],
      scrape ($) {
        const counties = []
        const $lis = $('span:contains("Latest COVID-19 Testing Data in Connecticut")')
              .nextAll('ul')
              .first()
              .find('li')
        $lis.each((index, li) => {
          if (index < 1) {
            return
          }
          const countyData = $(li).text().split(/:\s*/)
          counties.push({
            county: parse.string(countyData[0]),
            cases: parse.number(countyData[1])
          })
        })
        return counties

      }
    },
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'https://portal.ct.gov/Coronavirus',
        },
      ],
      scrape ($) {
        const counties = []
        const p = $(':contains("Fairfield County:")')
              .last()
              .text()
        const items = p.split('\n')
        for (const item of items) {
          const elements = item.split(':')
          const countyName = parse.string(elements[0])
          const cases = parse.number(elements[1])
          counties.push({
            county: countyName,
            cases
          })
        }
        return counties
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://portal.ct.gov/Coronavirus',
        },
      ],
      scrape ($) {
        const counties = []
        const $table = $('td:contains("Fairfield County")').closest('table')
        const $trs = $table.find('tbody > tr:not(:last-child)')
        $trs.each((index, tr) => {
          if (index < 2) {
            return
          }
          const $tr = $(tr)
          const countyName = geography.addCounty(parse.string($tr.find('td:first-child').text()))
          counties.push({
            county: countyName,
            cases: parse.number($tr.find('td:last-child').text())
          })
        })
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-21',
      crawl: [
        {
          type: 'pdf',
          url: () => {
            const d = new Date()
            return `https://portal.ct.gov/-/media/Coronavirus/CTDPHCOVID19summary${d.getMonth() + 1}${d.getUTCDate()}2020.pdf`
          }
        }
      ],
      scrape (body, date, { pdfUtils }) {
        const rows = pdfUtils.asWords(body, 0, 1).map(row => row.map(col => col.text))
        const counties = []
        const startIndex =
              rows.findIndex(row => row.length > 0 && row[0] === 'County' && row[1] === 'Confirmed Cases') + 1
        for (let i = startIndex; rows.length > 0 && rows[i][0] !== 'Total'; i++) {
          // Some stray numbers in the PDF, ignore
          if (!Number.isNaN(parse.number(rows[i][0]))) continue
          const countyName = geography.addCounty(rows[i][0])
          let cases
          let deaths
          if (rows[i].length === 4) {
            cases = parse.number(rows[i][1])
            deaths = parse.number(rows[i][3])
          } else if (rows[i].length === 5) {
            // sometimes Foo County gets split across columns 1+2
            cases = parse.number(rows[i][2])
            deaths = parse.number(rows[i][4])
          } else {
            throw new Error('Badly formatted row in PDF')
          }
          counties.push({
            county: countyName,
            cases,
            deaths
          })
        }
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-30',
      crawl: [
        {
          type: 'json',
          url: 'https://maps.ct.gov/arcgis/rest/services/CT_DPH_COVID_19_PROD_Layers/FeatureServer/1/query?f=json&where=1%3D1&returnGeometry=false&outFields=*',
        },
      ],
      scrape (data) {
        const counties = []
        data.features.forEach(item => {
          const cases = item.attributes.ConfirmedCases
          const deaths = item.attributes.Deaths
          const county = geography.addCounty(item.attributes.COUNTY)
          // On 3/31 these case counts were clearly updated, and agreed with the
          // state published PDF for 3/31. Yet this DateLastUpdated field still
          // showed 3/30. So this date field can not be trusted.
          //
          // if (datetime.scrapeDateIsAfter(item.attributes.DateLastUpdated)) {
          //  const dlu = item.attributes.DateLastUpdated
          //  throw new Error(`Data only available until ${new Date(dlu).toLocaleString()}`)
          // }
          counties.push({
            county,
            cases,
            deaths
          })
        })
        counties.push(transform.sumData(counties))
        return counties
      }
    }
  ]
}
