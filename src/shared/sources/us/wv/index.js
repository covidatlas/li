// Migrated from coronadatascraper, src/shared/scrapers/US/WV/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const assert = require('assert')

const _counties = [
  'Barbour County',
  'Berkeley County',
  'Boone County',
  'Braxton County',
  'Brooke County',
  'Cabell County',
  'Calhoun County',
  'Clay County',
  'Doddridge County',
  'Fayette County',
  'Gilmer County',
  'Grant County',
  'Greenbrier County',
  'Hampshire County',
  'Hancock County',
  'Hardy County',
  'Harrison County',
  'Jackson County',
  'Jefferson County',
  'Kanawha County',
  'Lewis County',
  'Lincoln County',
  'Logan County',
  'McDowell County',
  'Marion County',
  'Marshall County',
  'Mason County',
  'Mercer County',
  'Mineral County',
  'Mingo County',
  'Monongalia County',
  'Monroe County',
  'Morgan County',
  'Nicholas County',
  'Ohio County',
  'Pendleton County',
  'Pleasants County',
  'Pocahontas County',
  'Preston County',
  'Putnam County',
  'Raleigh County',
  'Randolph County',
  'Ritchie County',
  'Roane County',
  'Summers County',
  'Taylor County',
  'Tucker County',
  'Tyler County',
  'Upshur County',
  'Wayne County',
  'Webster County',
  'Wetzel County',
  'Wirt County',
  'Wood County',
  'Wyoming County',
]

/** WV posts a web page daily at 10 am and 5 pm,
 * eg. https://dhhr.wv.gov/News/2020/Pages/COVID-19-Daily-Update-5-4-2020---10-AM.aspx.
 * These pages appear to be machine generated as they
 * consistently followe exactly the same format.  Since I can't
 * find any scrapable underlying source data, I'll scrape this
 * page with regexes.  Fun.
 * WV publishes two pages each day:
 * - https://dhhr.wv.gov/News/2020/Pages/COVID-19-Daily-Update-5-4-2020---10-AM.aspx
 * - https://dhhr.wv.gov/News/2020/Pages/COVID-19-Daily-Update-5-4-2020---5-PM.aspx
          //
 * Sometimes they add extra dashes in front of the date ... :-( "...---5-6-2020")
 * so handle that too.
          //
 * Depending on the time we try to scrape, we may get 5 PM or 10 AM from today,
 * or 10 PM from yesterady.  Try each of these in turn, and stop when we get a hit.
 * Throw if we don't get any hits.
 */
async function getCurrentUrl (client) {
  const getDateString = dt => {
    const ds = dt.toLocaleString('en-US', { timeZone: 'America/Toronto' })
    return ds.split(',')[0]
  }

  const addUrls = (urls, dt, times) => {
    const ds = getDateString(dt).replace(/\//g, '-')
    for (const dateSep of [ '---', '-' ]) {
      for (const t of times) {
        const root = 'https://dhhr.wv.gov/News/2020/Pages/COVID-19-Daily-Update'
        urls.push([ root, dateSep, ds, '---', t, '.aspx' ].join(''))
      }
    }
  }

  const dt = new Date()
  const ydt = new Date()
  ydt.setDate(dt.getDate() - 1)
  const urls = []
  addUrls(urls, dt, [ '5-PM', '10-AM' ])
  addUrls(urls, ydt, [ '5-PM', '10-AM' ])

  console.log('Trying to get url, falling successively back.')
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    try {
      const data = await client({ url })
      if (data.body) {
        console.log(`Successful hit at ${url}`)
        return { url }
      }
    } catch (err) {
      console.log('failed')
    }

  }
  console.log(`No data published, expected at least data at ${urls[urls.length - 1]}`)
  throw new Error('No data')
}

module.exports = {
  state: 'iso2:US-WV',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://dhhr.wv.gov/COVID-19/Pages/default.aspx',
    name: 'West Virginia Department of Health & Human Resources',
  },
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          url: 'https://dhhr.wv.gov/COVID-19/Pages/default.aspx',
        },
      ],
      scrape ($) {
        const $p = $('p:contains("Counties with positive cases")')
        const list = $p.text().split(':')[1].split(',')
        let counties = []
        for (const item of list) {
          const items = item.split('(')
          if (items.length !== 2) {
            continue
          }
          const county = geography.addCounty(parse.string(items[0]))
          let cases = items[1]
          if (cases.slice(-1) !== ')') {
            continue
          }
          cases = parse.number(cases.slice(0, -1))
          counties.push({
            county,
            cases
          })
        }
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-04-03',
      crawl: [
        {
          type: 'json',
          url: 'https://wabi-us-gov-virginia-api.analysis.usgovcloudapi.net/public/reports/187b4de8-78ef-40be-9510-7fa9a1ef89f2/modelsAndExploration',
          options: {
            headers: { 'X-PowerBI-ResourceKey': '187b4de8-78ef-40be-9510-7fa9a1ef89f2' }
          }
        },
      ],
      scrape (data) {
        const { sections } = data.exploration
        let counties = []
        // This is all insanely horrible
        const heading = 'CONFIRMED CASES PER COUNTY:'
        for (const sec of sections) {
          for (const vc of sec.visualContainers) {
            if (vc.config.includes(heading)) {
              const config = JSON.parse(vc.config)
              let { textRuns } = config.singleVisual.objects.general[0].properties.paragraphs[0]
              textRuns = textRuns.map(tr => parse.string(tr.value))
              if (textRuns[0] !== heading) {
                throw new Error('Unknown json layout')
              }
              const pieces = textRuns[1].split(',')
              for (const row of pieces) {
                const countyPieces = parse.string(row).split('(')
                const county = geography.addCounty(parse.string(countyPieces[0]))
                const cases = parse.number(countyPieces[1])
                if (cases === 0) {
                  throw new Error('They are only listed counties with >0 cases, but I found 0?')
                }
                counties.push({
                  county,
                  cases
                })
              }
            }
          }
        }
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-05-05',
      crawl: [
        {
          type: 'page',
          url: async (client) => { return getCurrentUrl(client) }
        }
      ],
      scrape ($) {
        const data = []

        // County-level
        let label = 'CASES PER COUNTY:'
        let p = $(`p:contains("${label}")`)
        assert.equal(p.length, 1, `Have 1 paragraph containing ${label}`)
        let rawcounty = p.text().split(label)[1]
        assert(rawcounty, 'Have rawcounty')
        rawcounty = rawcounty.replace(/\n/g, ' ')
        rawcounty.split(',').forEach(c => {
          const cre = /(.*)\((.*)\)/
          const cmatch = c.match(cre)
          assert(cmatch, `Got match for ${cre} in ${c}`)
          // Remove County in case some names end in 'County' and some don't, then add it.
          const county = `${cmatch[1].replace(/County/, '').trim()} County`
          const cases = parseInt(cmatch[2].trim(), 10)
          data.push({
            county,
            cases
          })
        })

        // State-level
        label = 'laboratory results'
        p = $(`p:contains("${label}")`)
        assert(p.length >= 1, `Have at least 1 paragraph containing ${label}`)
        const ptext = p.toArray().map(e => $(e).text())
        const re = /there have been (.*?) laboratory results.*?with (.*?) positive,.*? and (.*?) deaths/s
        p = ptext.find(e => e.match(re))
        const raw = p.match(re)
        assert(raw, `Got match for ${re} in raw html`)
        // slice(1) because the first element is the full match.
        const [ tested, cases, deaths ] = raw
              .slice(1)
              .map(s => s.replace(',', ''))
              .map(s => parseInt(s, 10))
        const rawStateData = {
          tested,
          cases,
          deaths
        }
        data.push({ ...rawStateData, aggregate: 'county' })
        const result = geography.addEmptyRegions(data, _counties, 'county')
        // console.table(result)
        return result
      }
    },
    {
      startDate: '2020-05-24',
      crawl: [
        {
          type: 'page',
          url: async (client) => { return getCurrentUrl(client) }
        }
      ],
      scrape ($) {
        const data = []

        let label = 'CASES PER COUNTY'
        let p = $('p').toArray().
              map(p => $(p).text()).
              map(p => p.replace(/\n/g, ' ')).
              filter(p => p.includes(label))
        assert.equal(p.length, 1, `Have 1 paragraph containing ${label}`)
        // console.log(JSON.stringify(p.join()))

        // County-level
        let rawcounty = p[0].split(':')[1]
        assert(rawcounty, 'Have rawcounty')
        rawcounty.split(',').forEach(c => {
          const cre = /(.*)\((.*)\/.*\)/
          const cmatch = c.match(cre)
          assert(cmatch, `Got match for ${cre} in ${c}`)
          // Remove County in case some names end in 'County' and some don't, then add it.
          const county = `${cmatch[1].replace(/County/, '').trim()} County`
          const cases = parseInt(cmatch[2].trim(), 10)
          data.push({
            county,
            cases
          })
        })

        // State-level
        label = 'laboratory results'
        const ps = $('p').toArray().
          map(p => $(p).text()).
          map(p => p.replace(/\n/g, ' ')).
          filter(p => p.includes(label))
        assert(ps.length >= 1, `Have at least 1 paragraph containing ${label}`)
        const re = /there have been ([,\d]+) .*?results.*?with ([,\d]+) total cases.*? and (.*?) deaths/s
        p = ps.find(e => e.match(re))
        const raw = p.match(re)
        assert(raw, `Got match for ${re} in raw html`)
        // slice(1) because the first element is the full match.
        const [ tested, cases, deaths ] = raw
              .slice(1)
              .map(s => s.replace(',', ''))
              .map(s => parseInt(s, 10))
        const rawStateData = {
          tested,
          cases,
          deaths
        }
        data.push({ ...rawStateData, aggregate: 'county' })

        const result = geography.addEmptyRegions(data, _counties, 'county')
        // console.table(result)
        return result
      }
    }
  ]
}

