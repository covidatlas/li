// Migrated from coronadatascraper, src/shared/scrapers/US/KS/index.js


const srcShared = '../../../'
// const assert = require('assert')
const constants = require(srcShared + 'sources/_lib/constants.js')
const datetime = require(srcShared + 'datetime/index.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const sorter = require(srcShared + 'utils/sorter.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
// const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')
const { join, sep } = require('path')
// const usStates = require('./us-states.json')
// const glob = require('glob').sync
// const globJoin = require('../../utils/glob-join.js')
// const gssCodeMap = require('../_shared.js')
// const gssCodes = require('./gss-codes.json')
// const latinizationMap = require('./latinization-map.json')

const _counties = [
'Allen County',
'Anderson County',
'Atchison County',
'Barber County',
'Barton County',
'Bourbon County',
'Brown County',
'Butler County',
'Chase County',
'Chautauqua County',
'Cherokee County',
'Cheyenne County',
'Clark County',
'Clay County',
'Cloud County',
'Coffey County',
'Comanche County',
'Cowley County',
'Crawford County',
'Decatur County',
'Dickinson County',
'Doniphan County',
'Douglas County',
'Edwards County',
'Elk County',
'Ellis County',
'Ellsworth County',
'Finney County',
'Ford County',
'Franklin County',
'Geary County',
'Gove County',
'Graham County',
'Grant County',
'Gray County',
'Greeley County',
'Greenwood County',
'Hamilton County',
'Harper County',
'Harvey County',
'Haskell County',
'Hodgeman County',
'Jackson County',
'Jefferson County',
'Jewell County',
'Johnson County',
'Kearny County',
'Kingman County',
'Kiowa County',
'Labette County',
'Lane County',
'Leavenworth County',
'Lincoln County',
'Linn County',
'Logan County',
'Lyon County',
'Marion County',
'Marshall County',
'McPherson County',
'Meade County',
'Miami County',
'Mitchell County',
'Montgomery County',
'Morris County',
'Morton County',
'Nemaha County',
'Neosho County',
'Ness County',
'Norton County',
'Osage County',
'Osborne County',
'Ottawa County',
'Pawnee County',
'Phillips County',
'Pottawatomie County',
'Pratt County',
'Rawlins County',
'Reno County',
'Republic County',
'Rice County',
'Riley County',
'Rooks County',
'Rush County',
'Russell County',
'Saline County',
'Scott County',
'Sedgwick County',
'Seward County',
'Shawnee County',
'Sheridan County',
'Sherman County',
'Smith County',
'Stafford County',
'Stanton County',
'Stevens County',
'Sumner County',
'Thomas County',
'Trego County',
'Wabaunsee County',
'Wallace County',
'Washington County',
'Wichita County',
'Wilson County',
'Woodson County',
'Wyandotte County',
]

function _extractPdfSentences(data, pages = [1, 2, 3]) {
    const items = []
    // Remove nulls.
    for (const item of data) {
      if (item) items.push(item)
    }
    const textitems = items
      .filter(i => {
        return i.page && i.x && i.y && i.text
      })
      .filter(i => pages.includes(i.page))
    const pageYs = {}
    textitems.forEach(i => {
      const key = `${i.page}/${i.y}`
      if (!pageYs[key]) pageYs[key] = []
      pageYs[key].push(i)
    })
    // console.log(pageYs)
    // Join text in order of x, joining things with spaces or not depending on the xdiff.
    function joinLineGroup(items) {
      const itemsOrderByX = items.sort((a, b) => (a.x < b.x ? -1 : 1))
      // console.log(itemsOrderByX)
      let lastX = 0
      let line = itemsOrderByX.reduce((s, i) => {
        // console.log(i)
        // eyeballing spaces from the data!
        const xdiff = i.x - lastX
        // console.log(`xdiff: ${xdiff}`)
        const separator = xdiff < 1 ? '' : ' '
        lastX = i.x
        return s + separator + i.text
      }, '')
      // Comma separator.
      line = line.replace(/%2C/g, ',')
      // PDF xdiff seems to be off when separating numbers from text.
      line = line.replace(/(\d)([a-zA-Z])/g, function(m, a, b) {
        return `${a} ${b}`
      })
      line = line.replace(/([a-zA-Z])(\d)/g, function(m, a, b) {
        return `${a} ${b}`
      })
      // Remove comma separator between numbers.
      line = line.replace(/(\d),(\d)/g, function(m, a, b) {
        return `${a}${b}`
      })
      return line
    }
    const lineGroups = Object.values(pageYs)
    return lineGroups.map(joinLineGroup)
  }

function _parseDailySummary(body) {
    const sentences = this._extractPdfSentences(body)
    // console.log(sentences)
    // Regex the items we want from the sentences.
    const stateDataREs = {
      cases: /were (\d+) cases/,
      deaths: /with (\d+) deaths/,
      hospitalized: /been (\d+) of .* cases that have been hospitalized/,
      testedNeg: /(\d+) negative tests/
    }
    const rawStateData = Object.keys(stateDataREs).reduce((hsh, key) => {
      const re = stateDataREs[key]
      const text = sentences.filter(s => {
        return re.test(s)
      })
      if (text.length === 0) console.log(`No match for ${key} re ${re}`)
      if (text.length > 1) console.log(`Ambiguous match for ${key} re ${re} (${text.join(';')})`)
      const m = text[0].match(re)
      return {
        ...hsh,
        [key]: parse.number(m[1])
      }
    }, {})
    rawStateData.tested = rawStateData.cases + rawStateData.testedNeg
    delete rawStateData.testedNeg
    const data = []
    const countyRE = /^(.*) County (\d+)$/
    const countyData = sentences.filter(s => {
      return countyRE.test(s)
    })
    countyData.forEach(lin => {
      const cm = lin.trim().match(countyRE)
      // console.log(cm)
      const rawName = `${cm[1]} County`
      const countyName = geography.addCounty(rawName)
      const cases = cm[2]
      if (this._counties.includes(countyName)) {
        data.push({
          county: countyName,
          cases: parse.number(cases)
        })
      }
    })
    const summedData = transform.sumData(data)
    data.push(summedData)
    data.push({ ...rawStateData, aggregate: 'county' })
    const result = geography.addEmptyRegions(data, this._counties, 'county')
    // no sum because we explicitly add it above
    return result
  }


module.exports = {
  state: 'iso2:US-KS',
  country: 'iso1:US',
  aggregate: 'county',
  _baseUrl: 'https://khap2.kdhe.state.ks.us/NewsRelease/COVID19/',
  maintainers: [ maintainers.paulboal, maintainers.aed3 ],
  friendly:   {
    name: 'Kansas Department of Health and Environment',
    url: 'https://govstatus.egov.com/coronavirus',
  },
  scrapers: [
    {
      startDate: '2020-03-24',
      crawl: [
        {
          type: 'pdf',
          url: (client) => {
            const datePart = datetime.getMonthDYYYY(new Date())
            const url = `${this._baseUrl}COVID-19_${datePart}_.pdf`
            return { url }
          }
        },
      ],
      scrape (body) {
        if (body === null) {
          throw new Error(`No data for ${date}`)
        }
        const rows = pdfUtils.asRows(body).map(row => row.map(col => col.text))
        const counties = []
        const startIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Positive Case Information')) + 2
        for (let i = startIndex; i < rows.length; i++) {
          const data = rows[i]
          // First set of columns
          const countyName1 = geography.addCounty(data[0])
          const cases1 = data[1]
          if (this._counties.includes(countyName1)) {
            counties.push({
              county: countyName1,
              cases: parse.number(cases1)
            })
          }
          // Optional second set of columns
          if (data.length === 4) {
            const countyName2 = geography.addCounty(data[2])
            const cases2 = data[3]
            if (this._counties.includes(countyName2)) {
              counties.push({
                county: countyName2,
                cases: parse.number(cases2)
              })
            }
          }
        }
        const summedData = transform.sumData(counties)
        counties.push(summedData)
        return geography.addEmptyRegions(counties, _counties, 'county')
      }
    },
    {
      startDate: '2020-03-28',
      crawl: [
        {
          type: 'json',
          url: 'https://services9.arcgis.com/Q6wTdPdCh608iNrJ/arcgis/rest/services/COVID19_CountyStatus_KDHE/FeatureServer/0/query?f=json&where=Covid_Case%3D%27Yes%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=COUNTY%20asc&resultOffset=0&resultRecordCount=105&cacheHint=true',
        },
      ],
      scrape (data) {
        const counties = []
        data.features.forEach(item => {
          counties.push({
            county: geography.addCounty(item.attributes.COUNTY.replace(/\W/g, '')),
            cases: item.attributes.Covid_Conf,
            deaths: item.attributes.Covid_Deat,
            recovered: item.attributes.Covid_Reco
          })
        })
        counties.push(transform.sumData(counties))
        return geography.addEmptyRegions(counties, this._counties, 'county')
      }
    },
    /*
      Skipping 2020-04-01, which returned hardcoded data from an image.
    {
      startDate: '2020-04-01',
      crawl: [
        type: 'image',
        url: 'https://public.tableau.com/profile/kdhe.epidemiology#!/vizhome/COVID-19Data_15851817634470/KSCOVID-19CaseData'
      ],
      scrape (data, date, helpers) {
      }
    },
    */
    {
      startDate: '2020-04-02',
      crawl: [
        {
          type: 'pdf',
          url: 'https://public.tableau.com/views/COVID-19Data_15851817634470/CountyCounts.pdf?:showVizHome=no',
          name: 'cases',
        },
        {
          type: 'pdf',
          url: 'https://public.tableau.com/views/COVID-19Data_15851817634470/Mortality.pdf?:showVizHome=no',
          name: 'deaths',
        },
      ],
      scrape ({cases, deaths}) {
      const data = cases
        .filter(item => item && item.y > 6 && item.y < 46)
        .sort((a, b) => {
          const yDiff = a.y - b.y
          const xDiff = a.x - b.x
          const pageDiff = a.page - b.page
          return pageDiff || yDiff || xDiff
        })
      let name = ''
      let caseNum = ''
      const counties = []
      data.forEach((item, i) => {
        const c = item.text
        if (data[i - 1] && data[i - 1].y !== item.y) {
          counties.push({
            county: name.replace(/(?<!\s)County/, ' County'),
            cases: parse.number(caseNum)
          })
          name = ''
          caseNum = ''
        }
        if (c.match(/[0-9]/)) {
          caseNum += c
        } else {
          name += c.replace('ﬀ', 'ff')
        }
      })
      counties.push({
        county: name.replace(/(?<!\s)County/, ' County'),
        cases: parse.number(caseNum)
      })

      let totalDeaths = ''
      deaths.forEach(item => {
        if (item && item.text.match(/[0-9]/)) {
          totalDeaths += item.text
        }
      })
      const totalRow = transform.sumData(counties)
      totalRow.deaths = parse.number(totalDeaths)
      counties.push(totalRow)
      return geography.addEmptyRegions(counties, _counties, 'county')
}
    },
    {
      startDate: '2020-04-30',
      crawl: [
        {
          type: 'pdf',
          url: async (client) => {
            // The main page has an href that downloads a PDF.
            const entryUrl = 'https://www.coronavirus.kdheks.gov/'
            const { body } = await client({ url: entryUrl })
            const matches = body.match(
              /<a href="(?<url>.+?)".*(?:COVID-19 Summary)/
            )
            const url = matches && matches.groups && matches.groups.url
            assert(url, `no url found`)
            return ({ url })
          }
        }
      ],
      scrape (body) {
      if (body === null) {
        throw new Error(`No pdf at ${this.url}`)
      }
      return _parseDailySummary(body)
}
    },
    {
      startDate: '2020-05-06',
      crawl: [
        {
          type: 'pdf',
          url: async (client) => {
            // The main page has an href that downloads a PDF.
            const entryUrl = 'https://www.coronavirus.kdheks.gov/160/COVID-19-in-Kansas'
            const { body } = await client({ url: entryUrl })
            const matches = body.match(
              /gcc01.safelinks.protection.outlook.com.*url=(.*?)&.*/
            )
            let url = null
            if (matches.length > 0)
              url = matches[1]
            assert(url, `no url found`)
            url = url.replace(/%3A/g, ':').replace(/%2F/g, '/')
            return ({ url })
          }
        },
      ],
      scrape (body) {
        if (body === null) {
          throw new Error(`No pdf at ${this.url}`)
        }
        return this._parseDailySummary(body)
      }
    }
  ]
}


// TODO: delete unused requires
// TODO: multiple sources listed, only taking first, please verify
// TODO: fix 0 start date
// TODO: fix 0 scrape and crawl
// TODO: fix 2020-03-28 scrape and crawl
// TODO: fix 2020-04-01 scrape and crawl
// TODO: fix 2020-04-02 scrape and crawl
// TODO: fix 2020-04-30 scrape and crawl
// TODO: fix 2020-05-06 scrape and crawl
// TODO: "normalize" maintainers (replace with references, sorry :-) )
