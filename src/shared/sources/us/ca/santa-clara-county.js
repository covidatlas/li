const maintainers = require('../../_lib/maintainers.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  county: 'fips:06085',

  maintainers: [ maintainers.mnguyen ],

  timeseries: true,
  priority: 1,
  friendly: {
    name: 'County of Santa Clara Open Data Portal',
    url: 'https://data.sccgov.org/browse?category=COVID-19'
  },

  scrapers: [
    {
      startDate: '2020-01-27',
      crawl: [
        {
          type: 'json',
          name: 'casedata',
          url: 'https://data.sccgov.org/resource/6cnm-gchg.json',
        },
        {
          type: 'json',
          name: 'deathdata',
          url: 'https://data.sccgov.org/resource/tg4j-23y2.json',
        },
        {
          type: 'json',
          name: 'patientdata',
          url: 'https://data.sccgov.org/resource/5xkz-6esm.json',
        },
        {
          type: 'json',
          name: 'testdata',
          url: 'https://data.sccgov.org/resource/dvgc-tzgq.json',
        },
      ],
      scrape ({ casedata, deathdata, patientdata, testdata }, date) {
        var result = {}
        const dateTime = date + 'T00:00:00.000'

        const filteredCaseData = casedata.filter(r => r.date === dateTime)
        // Don't throw just because there's no case data; testing and hospitalization data may be fresher.
        if (filteredCaseData.length !== 0 && filteredCaseData[0].total_cases) {
          result.cases = parseInt(filteredCaseData[0].total_cases, 10)
        }

        // Death dataset only includes records for days on which there are new deaths, so there may be gaps.
        // Take the latest day up to the requested day or the last day on which cases or deaths are available.
        // If the most recent few days have case data but no death data, it likely means no recent deaths.
        const filteredDeathData = deathdata.filter(r => r.date <= dateTime).slice(-1)
        if (filteredDeathData.length !== 0 &&
            (dateTime <= deathdata.slice(-1)[0].date || dateTime <= casedata.slice(-1)[0].date) &&
            filteredDeathData[0].cumulative) {
          result.deaths = parseInt(filteredDeathData[0].cumulative, 10)
        }

        const filteredPatientData = patientdata.filter(r => r.date === dateTime)
        if (filteredPatientData.length !== 0) {
          const confirmedPatients = filteredPatientData[0].covid_total &&
            parseInt(filteredPatientData[0].covid_total, 10)
          const pui = filteredPatientData[0].pui_total && parseInt(filteredPatientData[0].pui_total, 10)
          if (confirmedPatients || pui) {
            result.hospitalized_current = confirmedPatients + pui
          }
          const confirmedICU = filteredPatientData[0].icu_covid && parseInt(filteredPatientData[0].icu_covid, 10)
          const puiICU = filteredPatientData[0].icu_pui && parseInt(filteredPatientData[0].icu_pui, 10)
          if (confirmedICU || puiICU) {
            result.icu_current = confirmedICU + puiICU
          }
        }

        // Test dataset only includes records for days on which there are new tests, so there may be gaps.
        // Take the latest day up to the requested day or the last day on which tests are available.
        // If the most recent few days have case data but no test data, it probably means a delay in reporting tests.
        const filteredTestData = testdata.filter(r => r.collection_date <= dateTime).slice(-1)
        if (filteredTestData.length !== 0 &&
            dateTime <= testdata.slice(-1)[0].collection_date &&
            filteredTestData[0].total) {
          result.tested = parseInt(filteredTestData[0].total, 10)
        }

        if (Object.keys(result).length === 0) {
          throw new Error(`No data as at ${date}`)
        }

        return result
      }
    },
  ]

}
