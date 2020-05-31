// Migrated from coronadatascraper, src/shared/scrapers/US/AZ/index.js

const srcShared = '../../../'
const assert = require('assert')
const datetime = require(srcShared + 'datetime/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


/** Convert T_* field heading used by AZ data source to yyyy-mm-dd string.
 * eg. T_4022020 or T_04022020 -> '2020-04-02'
 */
function parseDateField (s) {
  // Sometimes AZ decides to output their dates differently, eg
  // T_5122020,T_5202013 -- note the first is m/dd/yyyy, the
  // next is m/yyyy/dd.  Other examples: T_3202021,T_3202022.  Super.
  let tmp = s
  for (let y = 2020; y <= 2021; y++) {
    const ys = `${y}`
    if (tmp.includes(ys)) {
      tmp = `${tmp.split(ys).join('')}${ys}`
    }
  }

  let d = tmp.split('_')[1]
  d = d.padStart(8, '0')
  const month = d.slice(0, 2)
  const day = d.slice(2, 4)
  const year = d.slice(4)

  const p = n => parseInt(n, 10)
  assert(p(day) >= 1 && p(day) <= 31, `day ${day} valid for ${d}`)
  assert(p(month) >= 1 && p(month) <= 12, `month ${month} valid for ${d}`)
  assert(p(year) >= 2020 && p(year) <= new Date().getFullYear(), `year ${year} valid for ${d}`)

  const ret = [ year, month, day ]
        .map(n => `${n}`)
        .map(s => s.padStart(2, '0'))
        .join('-')
  return ret
}

module.exports = {
  state: 'iso2:US-AZ',
  country: 'iso1:US',
  timeseries: true,
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://www.azdhs.gov/',
    name: 'Arizona Department of Health Services',
  },
  scrapers: [
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/5b34cf1637434c7bb6793580c40d1685_0.csv',
        },
      ],
      scrape (data, date) {

        const datefields = Object.keys(data[0]).filter(f => f.match(/^T_\d+/))

        // Convert T_* field headings to yyyy-mm-dd
        const dataFixedHeadings = data.map(d => {
          const rec = {
            name: d.NAME,
            cases: parse.number(d.Number_Confirmed || 0),
            maxcases: 0,
            maxdate: null
          }
          datefields.reduce((hsh, df) => {
            const c = d[df] === '' ? undefined : parse.number(d[df])
            if (c !== undefined) hsh[parseDateField(df)] = c
            if ((c || 0) > rec.maxcases) {
              rec.maxcases = c
              rec.maxdate = df
            }
            return hsh
          }, rec)
          return rec
        })

        const warnings = dataFixedHeadings.filter(d => d.maxcases > d.cases)
        if (warnings.length > 0) {
          console.log(`Warning: cases potentially incorrect:`)
          warnings.forEach(w => {
            console.log(`* ${w.name}: ${w.maxcases} > ${w.cases} on ${w.maxdate}`)
          })
        }

        let dateString = datetime.getYYYYMMDD(date)
        const dates = Object.keys(dataFixedHeadings[0]).filter(f => f.match(/^\d+-\d+-\d+/))
        if (dateString < dates[0]) {
          throw new Error(`date ${dateString} < first date of data ${dates[0]}`)
        }
        const lastDate = dates[dates.length - 1]
        if (dateString > lastDate) {
          console.log(`US/AZ date ${dateString} > last date ${lastDate}, using last date.`)
          dateString = lastDate
        }
        const counties = []
        for (const d of dataFixedHeadings) {
          counties.push({
            // unfortunately even arcgis isnt reporting any death data
            county: d.name,
            cases: d[dateString]
          })
        }
        counties.push(transform.sumData(counties))
        // console.table(counties);
        return counties
      }
    }
  ]
}
