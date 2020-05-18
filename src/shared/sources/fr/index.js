// Migrated from coronadatascraper, src/shared/scrapers/FR/index.js

const srcShared = '../../'
const assert = require('assert')
const datetime = require(srcShared + 'datetime/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

const departementsToCountry = require('./departements-to-country.json')
const departementsToRegion = require('./departements-to-region.json')

/** A table of contents for subsequent fetches for data. */
const indexUrl = 'https://www.data.gouv.fr/fr/organizations/sante-publique-france/datasets-resources.csv'

/** Get the urls from indexUrl, and return the url whose title matches
 * the titleRegex.  We don't have csvParse available, so parsing by
 * hand. :-( */
async function getIndexUrl (client, titleRegex) {
  const { body } = await client({ url: indexUrl })
  assert(body, 'Should have a response body')
  const lines = body.split(/\r?\n/).filter(s => s.trim() !== '')
  assert(lines.length > 1, 'Need at least 1 line for titles')
  const headings = lines[0].split(';')

  function getHeadingIndex (heading) {
    const i = headings.indexOf(`"${heading}"`)
    assert(i !== -1, `No match for "${heading}"`)
    return i
  }

  for (let line of lines) {
    const a = line.split(';').map(s => s.replace(/^"/, '').replace(/"$/, ''))
    const title = a[ getHeadingIndex('title') ]
    const url = a[ getHeadingIndex('url') ]
    assert(title && url, `Have title and url in line "${line}"`)
    if (title.match(titleRegex))
      return url
  }

  throw new Error(`No match for title ${titleRegex} at ${indexUrl}`)
}


module.exports = {
  country: 'iso1:FR',
  timeseries: true,
  maintainers: [ maintainers.qgolsteyn, maintainers.jzohrab ],
  priority: 1,
  friendly:   {
    description: 'Santé publique France is the French national agency of public health.',
    name: 'Santé publique France',
    url: 'https://www.santepubliquefrance.fr/',
  },
  scrapers: [
    {
      // This is the data when both hospitalized and tested are both available.
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'csv',
          options: { delimiter: ';' },
          name: 'hospitalized',
          url: async (client) => {
            const url = await getIndexUrl(client, /^donnees-hospitalieres-covid19-.*.csv$/)
            return { url }
          }
        },
        {
          type: 'csv',
          options: { delimiter: ';' },
          name: 'tested',
          url: async (client) => {
            const url = await getIndexUrl(client, /^donnees-tests-covid19-labo-quotidien-.*.csv$/)
            return { url }
          }
        },
      ],
      scrape ( { hospitalized, tested }, date) {

        let hopitalizedData = hospitalized
        // console.log('raw hopitalizedData')
        // console.table(hopitalizedData)

        // Hospitalized data is broken down by gender, we are only interested in all genders
        hopitalizedData = hopitalizedData.filter(item => item.sexe === '0')
        // Sort by date to ensure accurate cummulative count
        hopitalizedData = hopitalizedData.sort((a, b) => a.jour - b.jour)

        let testedData = tested
        // Testing data is broken down by age group, we are only
        // interested in all age groups
        testedData = testedData.filter(item => item.clage_covid === '0')
        // Sort by date to ensure accurate cummulative count
        testedData = testedData.sort((a, b) => a.jour - b.jour)

        const testedByDepartements = {}
        // Capture cumulative testing data, as the testing data is for the day only
        for (const item of testedData) {
          if (datetime.dateIsBeforeOrEqualTo(item.jour, date))
            testedByDepartements[item.dep] = parse.number(item.nb_test) + (testedByDepartements[item.dep] || 0)
        }
        // console.log('tested by depts')
        // console.table(testedByDepartements)

        const hospitalizedByDepartments = {}
        // Discharged and deaths are cumulative, while hospitalized is current
        // We can calculate new patients with this formula:
        // new_patients = n_current_patients - n_yesterdays_patients + n__todays_discharged_patient + n_todays_deaths
        // We then sum the number of new_patients to get a cumulative number
        for (const item of hopitalizedData) {
          if (datetime.dateIsBeforeOrEqualTo(item.jour, date)) {
            const prev = hospitalizedByDepartments[item.dep]
            if (prev) {
              // Get the number of new discharged and deaths
              const deltaDeaths = parse.number(item.dc) - prev.deaths
              const deltaDischarged = parse.number(item.rad) - prev.discharged
              // Calculate new patients for today according to formula above
              const newHospitalized = parse.number(item.hosp) - prev.todayHospitalized + deltaDeaths + deltaDischarged
              hospitalizedByDepartments[item.dep] = {
                // Store today's number to calculate formula above
                todayHospitalized: parse.number(item.hosp),
                // Sum number of new hospitalization
                hospitalized: prev.hospitalized + newHospitalized,
                deaths: parse.number(item.dc),
                discharged: parse.number(item.rad)
              }
            } else {
              // First day with info for this departement
              hospitalizedByDepartments[item.dep] = {
                todayHospitalized: parse.number(item.hosp),
                hospitalized: parse.number(item.hosp),
                deaths: parse.number(item.dc),
                discharged: parse.number(item.rad)
              }
            }
          }
        }
        // console.log('hospit by depts')
        // console.table(hospitalizedByDepartments)

        const overseas = []
        const regions = {}
        const departements = []
        for (const dep of Object.keys(testedByDepartements)) {
          if (departementsToCountry[dep]) {
            // Overseas territories have their own country code
            // We treat them as country to follow standard set by Johns Hopkins dataset
            overseas.push({
              country: departementsToCountry[dep],
              tested: testedByDepartements[dep],
              ...hospitalizedByDepartments[dep]
            })
          } else {
            // Other departements are in Metropolitan France
            const item = {
              country: 'iso1:FR', // ISO1 code for Metropolitan France
              county: `iso2:FR-${dep}`,
              state: departementsToRegion[dep],
              tested: testedByDepartements[dep],
              ...hospitalizedByDepartments[dep]
            }
            // Add to a region dictionary to perform aggregation later
            const regionArr = regions[departementsToRegion[dep]] || []
            regionArr.push(item)
            regions[departementsToRegion[dep]] = regionArr
            departements.push(item)
          }
        }

        let msg = `Invalid number of départements, got ${departements.length}`
        assert.equal(departements.length, 96, msg)
        msg = `Invalid number of metropolitan régions, got ${Object.keys(regions).length}`
        assert.equal(Object.keys(regions).length, 13, msg)
        msg = `Invalid number of overseas territories, got ${overseas.length}`
        assert.equal(overseas.length, 5, msg)

        const data = []
        data.push(...overseas)
        data.push(...departements)

        // We aggregate by region
        for (const reg of Object.keys(regions)) {
          data.push(
            transform.sumData(regions[reg], {
              country: 'iso1:FX', // ISO1 code for Metropolitan France
              state: reg
            })
          )
        }

        // And for all of Metropolitan France
        data.push(transform.sumData(departements, { country: 'iso1:FX' }))

        // console.table(data)
        return data
      }
    }
  ]
}
